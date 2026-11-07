/* Los acuerdos de la Mesa. Lee data.json (generado por 06_web/exportar_datos.py) y dibuja en SVG propio. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var SUB = { BC: "Bajo Cauca", AN: "Alto Nordeste", Ambas: "Las dos subregiones", Otra: "Sin subregión" };
  var COL = { BC: "#2F6DB5", AN: "#EC297B" };
  var POSTIT = { reto: "#2F6DB5", oportunidad: "#E0A800", economica: "#3E9B4F", cultural: "#EC297B" };
  var estado = { sub: "todas", capa: "todas", todos: false };
  var D, MUN, RIOS;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function titulo(t) { return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(); }

  /* Tooltip */
  var tip = $("tip");
  function mostrar(ev, html) {
    tip.innerHTML = html; tip.hidden = false;
    var x = (ev.clientX || 0) + 14, y = (ev.clientY || 0) + 14;
    if (ev.type === "focus" && ev.target.getBoundingClientRect) { var r = ev.target.getBoundingClientRect(); x = r.right + 8; y = r.top; }
    var w = tip.offsetWidth, h = tip.offsetHeight;
    if (x + w > innerWidth - 8) x = innerWidth - w - 8;
    if (y + h > innerHeight - 8) y = innerHeight - h - 8;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function ocultar() { tip.hidden = true; }
  function conTip(n, html) {
    n.addEventListener("mousemove", function (e) { mostrar(e, html()); });
    n.addEventListener("mouseleave", ocultar);
    n.addEventListener("focus", function (e) { mostrar(e, html()); });
    n.addEventListener("blur", ocultar);
    n.addEventListener("click", function (e) { mostrar(e, html()); });
    n.setAttribute("tabindex", "0");
  }

  function aportesFiltrados() {
    return D.aportes.filter(function (a) {
      return (estado.sub === "todas" || a.subregion === estado.sub) && (estado.capa === "todas" || a.capa === estado.capa);
    });
  }

  /* Cabecera y camino */
  function cabecera() {
    var c = D.cifras;
    $("kicker").textContent = D.meta.sesion + " · " + D.meta.fecha;
    var f = D.meta.generado.split(" ")[0].split("-"), meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    $("sello").textContent = "Plan preliminar · datos al " + (+f[2]) + " " + meses[+f[1] - 1] + " " + f[0]; $("sello").hidden = false;
    var items = [[c.personas, "personas en la sala"], [c.organizaciones, "organizaciones"], [c.aportes, "aportes al mapa"], [c.lineas, "líneas de trabajo"], [c.acciones, "acciones propuestas"]];
    $("cifras").innerHTML = items.map(function (i) { return '<div class="cifra" role="listitem"><b>' + i[0] + "</b><span>" + i[1] + "</span></div>"; }).join("");
    var pasos = [
      { n: c.aportes, t: "aportes en el mapa de las dos subregiones" },
      { n: c.lineas, t: "líneas de trabajo, dos creadas en la sala" },
      { n: c.acciones, t: "acciones propuestas en las mesas" },
      { n: c.acciones_con_lidera, t: "de " + c.acciones + " acciones ya tienen quién lidera", p: c.acciones_con_lidera / c.acciones },
      { n: c.acciones_con_plazo, t: "de " + c.acciones + " acciones tienen plazo. Lo definimos en 48 horas", p: c.acciones_con_plazo / c.acciones, falta: true }
    ];
    $("camino").innerHTML = pasos.map(function (p) {
      var barra = p.p != null ? '<span class="barra" aria-hidden="true"><i style="width:' + Math.max(p.p * 100, p.p > 0 ? 4 : 0) + '%"></i></span>' : "";
      return '<li class="paso' + (p.falta ? " falta" : "") + '"><b>' + p.n + "</b><span>" + esc(p.t) + "</span>" + barra + "</li>";
    }).join("");
  }

  /* Filtros */
  function filtros() {
    var g = $("filtro-capas");
    var b = [{ id: "todas", nombre: "Todas" }].concat(D.capas);
    b.forEach(function (c) {
      var x = document.createElement("button");
      x.type = "button"; x.className = "chip" + (c.id === "todas" ? " activo" : ""); x.dataset.capa = c.id;
      x.setAttribute("aria-pressed", c.id === "todas" ? "true" : "false");
      x.innerHTML = (c.id !== "todas" ? '<i class="sw" style="background:' + POSTIT[c.id] + '"></i>' : "") + esc(c.nombre);
      g.appendChild(x);
    });
    document.querySelectorAll("[data-sub]").forEach(function (x) { x.addEventListener("click", function () { estado.sub = x.dataset.sub; activar("[data-sub]", x); pintar(); }); });
    document.querySelectorAll("[data-capa]").forEach(function (x) { x.addEventListener("click", function () { estado.capa = x.dataset.capa; activar("[data-capa]", x); pintar(); }); });
  }
  function activar(sel, x) {
    document.querySelectorAll(sel).forEach(function (y) { y.classList.toggle("activo", y === x); y.setAttribute("aria-pressed", y === x ? "true" : "false"); });
  }

  /* Mapa */
  function mapa() {
    var svg = $("mapa"); svg.innerHTML = "";
    var W = 640, H = 420, pad = 18;
    var pts = [];
    MUN.features.forEach(function (f) { anillos(f.geometry).forEach(function (r) { r.forEach(function (p) { pts.push(p); }); }); });
    var lon = pts.map(function (p) { return p[0]; }), lat = pts.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, lon), x1 = Math.max.apply(null, lon), y0 = Math.min.apply(null, lat), y1 = Math.max.apply(null, lat);
    var k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
    var s = Math.min((W - 2 * pad) / ((x1 - x0) * k), (H - 2 * pad) / (y1 - y0));
    var ox = (W - (x1 - x0) * k * s) / 2, oy = (H - (y1 - y0) * s) / 2;
    function P(p) { return [ox + (p[0] - x0) * k * s, oy + (y1 - p[1]) * s]; }
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var ap = aportesFiltrados();
    var cuenta = {}; ap.forEach(function (a) { if (a.municipio) cuenta[a.municipio] = (cuenta[a.municipio] || 0) + 1; });
    var centros = [];
    MUN.features.forEach(function (f) {
      var nombre = f.properties.mpio_cnmbr, sr = f.properties.subregion;
      var d = anillos(f.geometry).map(function (r) { return "M" + r.map(function (p) { return P(p).map(function (v) { return v.toFixed(1); }).join(","); }).join("L") + "Z"; }).join("");
      var path = el("path", { d: d, class: "mun " + sr.toLowerCase() + (estado.sub !== "todas" && estado.sub !== sr ? " dim" : "") }, svg);
      var c = centro(anillos(f.geometry).reduce(function (a, b) { return a.length > b.length ? a : b; }), P);
      centros.push({ nombre: nombre, sr: sr, c: c, n: cuenta[nombre] || 0 });
      conTip(path, function () {
        var lista = ap.filter(function (a) { return a.municipio === nombre; }).map(function (a) { return "· " + esc(a.texto); }).join("<br>");
        return "<b>" + esc(titulo(nombre)) + "</b> · " + SUB[sr] + "<br>" + (cuenta[nombre] || 0) + " aportes con este municipio" + (lista ? "<br>" + lista : "");
      });
    });
    RIOS.features.forEach(function (f) {
      lineasGeo(f.geometry).forEach(function (l) {
        el("path", { d: "M" + l.map(function (p) { return P(p).map(function (v) { return v.toFixed(1); }).join(","); }).join("L"), class: "rio" }, svg);
      });
    });
    var max = Math.max.apply(null, centros.map(function (c) { return c.n; }).concat([1]));
    centros.forEach(function (c) {
      if (c.n > 0) {
        var r = 6 + 14 * Math.sqrt(c.n / max);
        var b = el("circle", { cx: c.c[0], cy: c.c[1], r: r, fill: COL[c.sr], class: "burbuja" }, svg);
        conTip(b, function () { return "<b>" + esc(titulo(c.nombre)) + "</b><br>" + c.n + " aportes del mapa nombran este municipio"; });
        var v = el("text", { x: c.c[0], y: c.c[1] + 4, "text-anchor": "middle", fill: "#fff", "font-size": 11, "font-weight": 700, "pointer-events": "none" }, svg);
        v.textContent = c.n;
      }
      var t = el("text", { x: c.c[0], y: c.c[1] + (c.n > 0 ? 6 + 14 * Math.sqrt(c.n / max) + 12 : 4), "text-anchor": "middle", class: "nmun" }, svg);
      t.textContent = titulo(c.nombre);
    });
    var conMun = ap.filter(function (a) { return a.municipio; }).length;
    $("nota-mapa").textContent = "Los ocho municipios de la Mesa. Cada círculo cuenta los aportes que nombran un municipio: " + conMun + " de " + ap.length + ". Los demás hablan de toda la subregión.";
    $("leyenda-mapa").innerHTML = '<span><i class="pt bc"></i>Bajo Cauca</span><span><i class="pt an"></i>Alto Nordeste</span><span><i class="sw" style="background:#7FB2D6;height:3px;border:0"></i>Ríos Cauca y Nechí</span>';
  }
  function anillos(g) {
    if (g.type === "Polygon") return g.coordinates.slice(0, 1);
    if (g.type === "MultiPolygon") return g.coordinates.map(function (p) { return p[0]; });
    return [];
  }
  function lineasGeo(g) {
    if (g.type === "LineString") return [g.coordinates];
    if (g.type === "MultiLineString") return g.coordinates;
    return [];
  }
  function centro(r, P) {
    var a = 0, cx = 0, cy = 0, q = r.map(P);
    for (var i = 0; i < q.length - 1; i++) {
      var f = q[i][0] * q[i + 1][1] - q[i + 1][0] * q[i][1];
      a += f; cx += (q[i][0] + q[i + 1][0]) * f; cy += (q[i][1] + q[i + 1][1]) * f;
    }
    if (!a) return q[0];
    return [cx / (3 * a), cy / (3 * a)];
  }

  /* Barras agrupadas: aportes por capa y subregión */
  function barras() {
    var svg = $("barras"); svg.innerHTML = "";
    var W = 420, fila = 58, izq = 150, H = D.capas.length * fila + 10;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var base = D.aportes.filter(function (a) { return estado.sub === "todas" || a.subregion === estado.sub; });
    var datos = D.capas.map(function (c) {
      return { c: c, BC: base.filter(function (a) { return a.capa === c.id && a.subregion === "BC"; }).length, AN: base.filter(function (a) { return a.capa === c.id && a.subregion === "AN"; }).length };
    });
    var max = Math.max.apply(null, datos.map(function (d) { return Math.max(d.BC, d.AN); }).concat([1]));
    var ancho = W - izq - 40;
    el("line", { x1: izq, x2: izq, y1: 4, y2: H - 4, stroke: "#E5E7EB" }, svg);
    datos.forEach(function (d, i) {
      var y = i * fila + 8;
      var et = el("text", { x: izq - 10, y: y + 22, "text-anchor": "end", class: "ejel" }, svg);
      et.textContent = d.c.nombre;
      ["BC", "AN"].forEach(function (s, j) {
        if (estado.sub !== "todas" && estado.sub !== s) return;
        var w = Math.max(d[s] / max * ancho, d[s] ? 4 : 0), yy = y + j * 20;
        var g = el("g", { class: "barra-g" }, svg);
        el("rect", { x: izq + 1, y: yy, width: w, height: 16, rx: 4, fill: COL[s], opacity: estado.capa === "todas" || estado.capa === d.c.id ? 1 : 0.3 }, g);
        var hit = el("rect", { x: izq, y: yy - 2, width: ancho + 40, height: 20, fill: "transparent" }, g);
        var v = el("text", { x: izq + w + 6, y: yy + 12, class: "valor" }, g);
        v.textContent = d[s];
        conTip(hit, function () { return "<b>" + esc(d.c.nombre) + "</b><br>" + SUB[s] + ": " + d[s] + " aportes"; });
      });
    });
    $("tabla-capas").innerHTML = "<thead><tr><th>Capa</th><th class=n>Bajo Cauca</th><th class=n>Alto Nordeste</th></tr></thead><tbody>" +
      datos.map(function (d) { return "<tr><td>" + esc(d.c.nombre) + "</td><td class=n>" + d.BC + "</td><td class=n>" + d.AN + "</td></tr>"; }).join("") + "</tbody>";
  }

  /* Aportes literales */
  function aportes() {
    var ap = aportesFiltrados().slice().sort(function (a, b) { return (b.destacado - a.destacado); });
    var vis = estado.todos ? ap : ap.slice(0, 12);
    var nombre = {}; D.capas.forEach(function (c) { nombre[c.id] = c.nombre; });
    $("aportes").innerHTML = vis.map(function (a) {
      return '<li class="aporte c-' + a.capa + (a.destacado ? " destacado" : "") + '"><i class="pt ' + a.subregion.toLowerCase() + '" aria-hidden="true"></i><span>' + esc(a.texto) +
        "<small>" + esc(nombre[a.capa]) + " · " + SUB[a.subregion] + (a.municipio ? " · " + esc(titulo(a.municipio)) : "") + (a.destacado ? " · destacado por el equipo" : "") + "</small></span></li>";
    }).join("");
    $("nota-aportes").textContent = ap.length + " aportes con este filtro. Van como los escribió la relatoría, con su ortografía. El borde azul marca los que el equipo destacó.";
    var b = $("ver-mas"); b.hidden = ap.length <= 12; b.textContent = estado.todos ? "Ver menos" : "Ver los " + ap.length;
  }

  /* Líneas */
  function lineas() {
    $("tarjetas").innerHTML = D.lineas.map(function (l) {
      var acc = l.acciones.map(function (a) {
        var quien = a.lidera.length ? '<span class="quien">' + esc(a.lidera.join(" · ")) + "</span>" : '<span class="quien vacio">Quién lidera: por definir</span>';
        var tags = '<span class="tag">Plazo: ' + esc(a.plazo_texto) + "</span>" + (a.acepta ? "" : '<span class="tag falta">Aceptación por confirmar</span>');
        return '<div class="accion"><span class="id">' + esc(a.id) + "</span>" + esc(a.texto) + quien + '<div class="etiquetas">' + tags + "</div></div>";
      }).join("");
      var partida = l.porque ? '<div class="partida"><b>De partida:</b> ' + esc(l.porque) + (l.propuesta ? ". " + esc(l.propuesta) + "." : "") + "</div>" : "";
      return '<article class="linea" data-n="' + l.n + '"><header><span class="num">' + l.n + '</span><div><h3>' + esc(l.nombre) + '</h3><span class="origen">' + esc(l.origen) + "</span></div></header>" +
        '<span class="estado ' + (l.estado === "abierta" ? "abierta" : "con") + '">' + (l.estado === "abierta" ? "Línea abierta" : l.acciones.length + (l.acciones.length === 1 ? " acción" : " acciones")) + "</span>" +
        partida + (acc || '<p class="faltan">Aún sin acciones. Las completamos en 48 horas.</p>') +
        (l.falta.length ? '<p class="faltan">Falta: ' + esc(l.falta.join(", ")) + "</p>" : "") + "</article>";
    }).join("");
  }

  /* Red de compromisos: organizaciones a la izquierda, líneas a la derecha */
  function red() {
    var svg = $("red"); svg.innerHTML = "";
    var orgs = [], hilos = [];
    D.lineas.forEach(function (l) {
      l.acciones.forEach(function (a) {
        a.lidera.forEach(function (o) {
          if (orgs.indexOf(o) < 0) orgs.push(o);
          var h = hilos.filter(function (x) { return x.o === o && x.l === l.n; })[0];
          if (h) h.acc.push(a.id); else hilos.push({ o: o, l: l.n, acc: [a.id] });
        });
      });
    });
    var mobile = innerWidth < 700;
    var W = mobile ? 360 : 900, fila = 34, top = 20;
    var H = Math.max(orgs.length, D.lineas.length) * fila + top * 2;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var xo = mobile ? 150 : 300, xl = mobile ? 200 : 560;
    var yo = function (i) { return top + i * (H - 2 * top) / Math.max(orgs.length - 1, 1); };
    var yl = function (i) { return top + i * (H - 2 * top) / Math.max(D.lineas.length - 1, 1); };
    var fig = svg.parentNode;
    var hs = hilos.map(function (h) {
      var i = orgs.indexOf(h.o), j = D.lineas.map(function (l) { return l.n; }).indexOf(h.l);
      var y1 = yo(i), y2 = yl(j), mx = (xo + xl) / 2;
      var p = el("path", { d: "M" + xo + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + xl + "," + y2, class: "hilo", "stroke-width": 1.5 + 1.5 * h.acc.length }, svg);
      p.dataset.o = h.o; p.dataset.l = h.l; return p;
    });
    function foco(o, l) {
      fig.classList.toggle("foco", !!(o || l));
      hs.forEach(function (p) { p.classList.toggle("on", (o && p.dataset.o === o) || (l && p.dataset.l == l)); });
    }
    orgs.forEach(function (o, i) {
      var g = el("g", { class: "nodo" }, svg);
      el("circle", { cx: xo, cy: yo(i), r: 6, fill: "#003A70" }, g);
      var t = el("text", { x: xo - 12, y: yo(i) + 4, "text-anchor": "end", "font-size": mobile ? 10 : 13, fill: "#1F2937", "font-weight": 600 }, g);
      t.textContent = o.length > (mobile ? 22 : 40) ? o.slice(0, mobile ? 21 : 39) + "…" : o;
      var n = hilos.filter(function (h) { return h.o === o; });
      g.addEventListener("mouseenter", function () { foco(o); }); g.addEventListener("mouseleave", function () { foco(); ocultar(); });
      conTip(g, function () { return "<b>" + esc(o) + "</b><br>" + n.map(function (h) { return "Línea " + h.l + ": acción " + h.acc.join(", "); }).join("<br>"); });
      g.addEventListener("focus", function () { foco(o); });
    });
    D.lineas.forEach(function (l, j) {
      var g = el("g", { class: "nodo" }, svg);
      var tiene = hilos.some(function (h) { return h.l === l.n; });
      el("circle", { cx: xl, cy: yl(j), r: 11, fill: tiene ? "#003A70" : "#fff", stroke: "#003A70", "stroke-width": 2, "stroke-dasharray": tiene ? "" : "3 3" }, g);
      var nn = el("text", { x: xl, y: yl(j) + 4, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: tiene ? "#fff" : "#003A70" }, g);
      nn.textContent = l.n;
      var t = el("text", { x: xl + 18, y: yl(j) + 4, "font-size": mobile ? 10 : 13, fill: tiene ? "#1F2937" : "#4B5563" }, g);
      var nom = l.nombre.replace(" (hub logístico)", "");
      t.textContent = mobile && nom.length > 20 ? nom.slice(0, 19) + "…" : nom + (tiene ? "" : " · abierta");
      g.addEventListener("mouseenter", function () { foco(null, l.n); }); g.addEventListener("mouseleave", function () { foco(); ocultar(); });
      conTip(g, function () { return "<b>" + l.n + ". " + esc(l.nombre) + "</b><br>" + (tiene ? l.acciones.length + " acciones" : "Línea abierta: sin compromisos todavía"); });
    });
  }

  /* Tiempo y carril de lo pendiente */
  function tiempo() {
    $("tiempo").innerHTML = D.seguimiento.map(function (s) { return '<li class="hito' + (s.hecho ? " hecho" : "") + '"><b>' + esc(s.cuando) + "</b><span>" + esc(s.que) + "</span></li>"; }).join("");
    var sin = []; D.lineas.forEach(function (l) { l.acciones.forEach(function (a) { if (!a.plazo_meses) sin.push(a); }); });
    $("carril").hidden = !sin.length;
    $("carril").innerHTML = sin.length ? "<h3>" + sin.length + " acciones esperan su plazo</h3><p class=nota>Las ubicamos en el tiempo con cada responsable en las próximas 48 horas.</p><ul>" +
      sin.map(function (a) { return "<li><b>" + esc(a.id) + "</b> " + esc(a.texto.length > 60 ? a.texto.slice(0, 58) + "…" : a.texto) + "</li>"; }).join("") + "</ul>" : "";
  }

  /* Lo que nos une */
  function une() {
    var t = D.cifras.personas;
    $("une").innerHTML = D.encuentros.map(function (e) {
      return "<li>«…" + esc(e.frase) + "» <small>" + e.personas + " de " + t + " personas</small><div class=barra aria-hidden=true><i style='width:" + (e.personas / t * 100) + "%'></i></div></li>";
    }).join("");
    $("nota-une").textContent = "En los encuentros improbables, cuántas personas entraron al cuadrado con cada frase sobre la región.";
  }

  function dato() {
    if (!D.dato || !D.dato.texto) { $("dato").hidden = true; return; }
    $("dato").hidden = false;
    $("dato").innerHTML = '<span class="k">Un dato para la conversación</span><p>' + esc(D.dato.texto) + "</p><small>Fuente: " + esc(D.dato.fuente) + "</small>";
    $("fuentes").textContent = D.meta.nota + " Fuente: " + D.fuentes.sesion + ". Actualizado: " + D.meta.generado + ".";
  }

  function pintar() { mapa(); barras(); aportes(); }

  $("ver-mas").addEventListener("click", function () { estado.todos = !estado.todos; aportes(); });
  var ancho = innerWidth;
  addEventListener("resize", function () { if ((innerWidth < 700) !== (ancho < 700)) { ancho = innerWidth; red(); } });

  function traer(u, intentos) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); })
      .catch(function (e) { if (intentos > 0) return new Promise(function (ok) { setTimeout(ok, 600); }).then(function () { return traer(u, intentos - 1); }); throw e; });
  }
  Promise.all(["data.json", "municipios.geojson", "rios.geojson"].map(function (u) { return traer(u, 2); }))
    .then(function (r) {
      D = r[0]; MUN = r[1]; RIOS = r[2];
      cabecera(); filtros(); pintar(); lineas(); red(); tiempo(); une(); dato();
    })
    .catch(function () { document.querySelector(".pagina").insertAdjacentHTML("beforeend", "<p>No pudimos cargar los datos. Abre esta página desde la dirección de la Mesa.</p>"); });
})();
