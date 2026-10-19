// Clinical Trend Visualizations using Chart.js

let proteinChartInstance = null;
let bpChartInstance = null;
let weightChartInstance = null;

const PROTEIN_NUM_MAP = {
  'Neg': 0, 'Negative': 0,
  'Trace': 0.5,
  '+': 1, '1+': 1,
  '++': 2, '2+': 2,
  '+++': 3, '3+': 3,
  '++++': 4, '4+': 4
};

const PROTEIN_COLOR_MAP = {
  0: '#F6F48F',
  0.5: '#D2E882',
  1: '#89CF70',
  2: '#48B665',
  3: '#268D57',
  4: '#125537'
};

function renderAllCharts(logs) {
  if (!window.Chart) {
    console.warn('Chart.js not yet loaded');
    return;
  }

  // Sort logs chronologically (oldest to newest)
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  renderProteinChart(sortedLogs);
  renderBpChart(sortedLogs);
  renderWeightChart(sortedLogs);
}

function renderProteinChart(logs) {
  const ctx = document.getElementById('proteinChartCanvas');
  if (!ctx) return;

  const labels = logs.map(l => {
    const d = new Date(l.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const values = logs.map(l => PROTEIN_NUM_MAP[l.urine_protein] !== undefined ? PROTEIN_NUM_MAP[l.urine_protein] : 0);
  const pointColors = values.map(v => PROTEIN_COLOR_MAP[v] || '#1b5e3c');

  if (proteinChartInstance) {
    proteinChartInstance.destroy();
  }

  proteinChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: currentLang === 'hi' ? 'यूरिन प्रोटीन स्तर' : 'Urine Protein Level',
        data: values,
        borderColor: '#1b5e3c',
        backgroundColor: 'rgba(27, 94, 60, 0.08)',
        pointBackgroundColor: pointColors,
        pointBorderColor: '#333333',
        pointBorderWidth: 1.5,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 4.2,
          ticks: {
            stepSize: 1,
            callback: function(val) {
              if (val === 0) return 'Neg';
              if (val === 0.5) return 'Trace';
              if (val === 1) return '+';
              if (val === 2) return '++';
              if (val === 3) return '+++';
              if (val === 4) return '++++';
              return '';
            }
          },
          grid: {
            color: function(context) {
              if (context.tick.value >= 3) return 'rgba(220, 38, 38, 0.2)'; // highlight relapse zone in faint red
              return 'rgba(0, 0, 0, 0.05)';
            }
          }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed.y;
              let label = 'Neg';
              if (val === 0.5) label = 'Trace (~15-30 mg/dL)';
              else if (val === 1) label = '1+ (~30-100 mg/dL)';
              else if (val === 2) label = '2+ (~100-300 mg/dL)';
              else if (val === 3) label = '3+ (~300-1000 mg/dL - High)';
              else if (val === 4) label = '4+ (>1000 mg/dL - Very High)';
              return `Protein: ${label}`;
            }
          }
        }
      }
    }
  });
}

function renderBpChart(logs) {
  const ctx = document.getElementById('bpChartCanvas');
  if (!ctx) return;

  const labels = logs.map(l => {
    const d = new Date(l.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const mornSys = logs.map(l => l.bp_morning_systolic || null);
  const mornDia = logs.map(l => l.bp_morning_diastolic || null);
  const eveSys = logs.map(l => l.bp_evening_systolic || null);
  const eveDia = logs.map(l => l.bp_evening_diastolic || null);

  if (bpChartInstance) {
    bpChartInstance.destroy();
  }

  bpChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: currentLang === 'hi' ? 'सुबह सिस्टोलिक (Systolic Morn)' : 'Morning Systolic',
          data: mornSys,
          borderColor: '#0284c7',
          backgroundColor: '#0284c7',
          pointRadius: 4,
          tension: 0.2
        },
        {
          label: currentLang === 'hi' ? 'सुबह डायस्टोलिक (Diastolic Morn)' : 'Morning Diastolic',
          data: mornDia,
          borderColor: '#38bdf8',
          backgroundColor: '#38bdf8',
          borderDash: [4, 4],
          pointRadius: 3,
          tension: 0.2
        },
        {
          label: currentLang === 'hi' ? 'शाम सिस्टोलिक (Systolic Eve)' : 'Evening Systolic',
          data: eveSys,
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b',
          pointRadius: 4,
          tension: 0.2
        },
        {
          label: currentLang === 'hi' ? 'शाम डायस्टोलिक (Diastolic Eve)' : 'Evening Diastolic',
          data: eveDia,
          borderColor: '#fbbf24',
          backgroundColor: '#fbbf24',
          borderDash: [4, 4],
          pointRadius: 3,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 40,
          max: 140,
          title: { display: true, text: 'mmHg' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderWeightChart(logs) {
  const ctx = document.getElementById('weightChartCanvas');
  if (!ctx) return;

  const validWeightLogs = logs.filter(l => l.weight && l.weight > 0);
  const labels = validWeightLogs.map(l => {
    const d = new Date(l.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  const weights = validWeightLogs.map(l => l.weight);

  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: currentLang === 'hi' ? 'वज़न (kg)' : 'Weight (kg)',
        data: weights,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        pointBackgroundColor: '#8b5cf6',
        pointRadius: 5,
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'kg' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

window.renderAllCharts = renderAllCharts;
