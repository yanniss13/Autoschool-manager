(() => {
  const chartEl = document.querySelector('[data-progress-chart]');
  if (!chartEl || typeof ApexCharts === 'undefined') return;

  const rates = (chartEl.dataset.rates || '')
    .split(',')
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));

  if (rates.length === 0) return;

  const root = document.documentElement;
  const css = () => getComputedStyle(root);
  const cssVar = (name) => css().getPropertyValue(name).trim();
  const labels = rates.map((_, index) => `Session ${index + 1}`);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function chartTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function options() {
    const primary = cssVar('--primary') || '#2f57d6';
    const surface = cssVar('--surface') || '#ffffff';
    const text = cssVar('--text') || '#1f2933';
    const muted = cssVar('--muted') || '#6b7280';
    const border = cssVar('--border') || '#d8dee8';

    return {
      series: [{ name: 'Réussite', data: rates }],
      chart: {
        type: 'area',
        height: 310,
        parentHeightOffset: 0,
        toolbar: { show: false },
        zoom: { enabled: false },
        foreColor: muted,
        fontFamily: 'Public Sans, system-ui, sans-serif',
        background: 'transparent',
        animations: {
          enabled: !prefersReducedMotion,
          easing: 'easeout',
          speed: 650,
          animateGradually: { enabled: true, delay: 90 },
          dynamicAnimation: { enabled: true, speed: 250 },
        },
        dropShadow: {
          enabled: true,
          top: 8,
          left: 0,
          blur: 18,
          opacity: chartTheme() === 'dark' ? 0.24 : 0.16,
          color: primary,
        },
      },
      theme: { mode: chartTheme() },
      colors: [primary],
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 4,
        lineCap: 'round',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: chartTheme(),
          type: 'vertical',
          shadeIntensity: 0.18,
          opacityFrom: chartTheme() === 'dark' ? 0.42 : 0.34,
          opacityTo: 0.03,
          stops: [0, 85, 100],
        },
      },
      markers: {
        size: 5,
        strokeWidth: 3,
        strokeColors: surface,
        colors: [primary],
        hover: { size: 7 },
      },
      grid: {
        borderColor: border,
        strokeDashArray: 5,
        padding: { top: 8, right: 18, bottom: 0, left: 10 },
      },
      xaxis: {
        categories: labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: labels.map(() => muted), fontWeight: 700 },
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          formatter: (value) => `${Math.round(value)}%`,
          style: { colors: [muted], fontWeight: 700 },
        },
      },
      tooltip: {
        theme: chartTheme(),
        marker: { show: false },
        y: { formatter: (value) => `${value}% de réussite` },
        style: { fontSize: '13px', fontFamily: 'Public Sans, system-ui, sans-serif' },
      },
      states: {
        hover: { filter: { type: 'lighten', value: 0.04 } },
        active: { filter: { type: 'none', value: 0 } },
      },
      noData: {
        text: 'Aucune session enregistrée',
        style: { color: text },
      },
    };
  }

  const chart = new ApexCharts(chartEl, options());
  chart.render().then(() => {
    chartEl.classList.add('is-chart-ready');
  });

  const observer = new MutationObserver(() => {
    chart.updateOptions(options(), false, true);
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
})();
