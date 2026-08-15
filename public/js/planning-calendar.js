// Initialise FullCalendar sur l'element #calendar a partir de ses attributs data-*.
// Partage par la vue gerant (editable) et l'espace employe / eleve (lecture seule).
//
// FullCalendar (~282 Ko) est CHARGE PARESSEUSEMENT : la lib n'est injectee que
// lorsque le calendrier approche du viewport (IntersectionObserver). Sur les pages
// ou le calendrier est sous la ligne de flottaison (espace eleve / employe), cela
// evite d'executer 282 Ko de JS au chargement initial -> TBT bien plus bas.
(function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtLocal(d) { return fmtDate(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // Injecte un script externe et resout la promesse quand il est charge.
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Echec du chargement de ' + src)); };
      document.head.appendChild(s);
    });
  }

  // Charge FullCalendar (lib + locale fr) une seule fois. La locale doit venir
  // APRES la lib principale car elle s'y enregistre.
  var fcPromise = null;
  function ensureFullCalendar() {
    if (typeof FullCalendar !== 'undefined') return Promise.resolve();
    if (fcPromise) return fcPromise;
    fcPromise = loadScript('/vendor/fullcalendar/index.global.min.js')
      .then(function () { return loadScript('/vendor/fullcalendar/fr.global.min.js'); });
    return fcPromise;
  }

  function initCalendar(el) {
    var editable = el.dataset.editable === 'true';
    var csrf = el.dataset.csrf || '';
    var createBase = el.dataset.createBase || '';
    var moveTemplate = el.dataset.moveUrl || '';

    // Envoie les nouvelles heures au serveur (drag & drop). Annule visuellement en cas d'echec.
    function persist(info) {
      if (!moveTemplate) { info.revert(); return; }
      var url = moveTemplate.replace('__ID__', info.event.id);
      var body = new URLSearchParams({
        _csrf: csrf,
        start: fmtLocal(info.event.start),
        end: fmtLocal(info.event.end || info.event.start),
      });
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrf },
        body: body.toString(),
      })
        .then(function (res) { if (!res.ok) info.revert(); })
        .catch(function () { info.revert(); });
    }

    // En dessous de cette largeur, la vue « semaine » (7 colonnes) devient
    // illisible : on bascule sur la vue « jour ». On garde un selecteur
    // Semaine / Jour et on re-bascule automatiquement au redimensionnement.
    var NARROW = 700;
    function isNarrow() { return window.innerWidth < NARROW; }
    var wasNarrow = isNarrow();
    function pickView() { return isNarrow() ? 'timeGridDay' : 'timeGridWeek'; }
    function pickToolbar() {
      // Sur petit ecran on allege la barre (pas de selecteur de vue : la vue
      // jour est imposee) ; sur large on propose la bascule Semaine / Jour.
      return isNarrow()
        ? { left: 'prev,next', center: 'title', right: 'today' }
        : { left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' };
    }

    var calendar = new FullCalendar.Calendar(el, {
      initialView: pickView(),
      locale: 'fr',
      firstDay: 1,
      allDaySlot: false,
      slotMinTime: '07:00:00',
      slotMaxTime: '20:00:00',
      nowIndicator: true,
      height: 'auto',
      expandRows: true,
      headerToolbar: pickToolbar(),
      // On ne recale la vue que lorsqu'on FRANCHIT le point de rupture, pour ne
      // pas ecraser un choix manuel Semaine / Jour lors d'un simple resize.
      windowResize: function () {
        var narrowNow = isNarrow();
        if (narrowNow !== wasNarrow) {
          wasNarrow = narrowNow;
          calendar.changeView(pickView());
          calendar.setOption('headerToolbar', pickToolbar());
        }
      },
      events: el.dataset.eventsUrl,
      editable: editable,
      eventStartEditable: editable,
      eventDurationEditable: editable,
      selectable: editable,
      eventClick: function (info) {
        if (!editable) return;
        info.jsEvent.preventDefault();
        window.location.href = '/planning/' + info.event.id + '/edit';
      },
      select: function (info) {
        if (!editable || !createBase) return;
        window.location.href = createBase + '&date=' + fmtDate(info.start) + '&hour=' + info.start.getHours();
      },
      eventDrop: persist,
      eventResize: persist,
    });

    calendar.render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('calendar');
    if (!el) return;

    function boot() { ensureFullCalendar().then(function () { initCalendar(el); }); }

    // Sans IntersectionObserver (vieux navigateurs), on charge immediatement.
    if (!('IntersectionObserver' in window)) { boot(); return; }

    // rootMargin : on declenche le chargement un peu AVANT que le calendrier
    // n'entre a l'ecran, pour qu'il soit pret au moment ou l'utilisateur arrive.
    var io = new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { obs.disconnect(); boot(); }
    }, { rootMargin: '200px' });
    io.observe(el);
  });
})();
