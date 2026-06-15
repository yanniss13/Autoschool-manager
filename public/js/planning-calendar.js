// Initialise FullCalendar sur l'element #calendar a partir de ses attributs data-*.
// Partage par la vue gerant (editable) et l'espace employe (lecture seule).
(function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtLocal(d) { return fmtDate(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('calendar');
    if (!el || typeof FullCalendar === 'undefined') return;

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

    var calendar = new FullCalendar.Calendar(el, {
      initialView: 'timeGridWeek',
      locale: 'fr',
      firstDay: 1,
      allDaySlot: false,
      slotMinTime: '07:00:00',
      slotMaxTime: '20:00:00',
      nowIndicator: true,
      height: 'auto',
      headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
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
  });
})();
