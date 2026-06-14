document.addEventListener('DOMContentLoaded', () => {
    const dataNode = document.getElementById('dashboardCharts');
    if (!dataNode || !window.Chart) {
        return;
    }

    const rawData = JSON.parse(dataNode.textContent);
    const palette = {
        blue: '#2854f5',
        indigo: '#4f46e5',
        purple: '#8b5cf6',
        emerald: '#10b981',
        amber: '#f59e0b',
        red: '#ef4444',
        sky: '#0ea5e9'
    };

    const fallback = {
        weekly: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], revenue: [22000, 28500, 25100, 33800, 42100, 51700, 46800] },
        top_products: { labels: ['Milk', 'Bread', 'Rice', 'Eggs', 'Coffee', 'Apples'], quantity: [180, 150, 132, 118, 92, 84], revenue: [10800, 7500, 18480, 7080, 13800, 6720] },
        customer_growth: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], count: [26, 34, 47, 58] },
        category_distribution: { labels: ['Dairy', 'Bakery', 'Grocery', 'Produce', 'Beverages'], count: [28, 18, 36, 22, 16] }
    };

    const hasValues = (values) => Array.isArray(values) && values.some((value) => Number(value) > 0);
    const pick = (section, key) => {
        const source = rawData[section] || {};
        if (hasValues(source[key])) {
            return source;
        }
        return fallback[section] || source;
    };

    const makeGradient = (ctx, top, bottom) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, top);
        gradient.addColorStop(1, bottom);
        return gradient;
    };

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 1100, easing: 'easeOutQuart' },
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    color: '#64748b',
                    font: { weight: 700 }
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 700 } } },
            y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, .18)' }, ticks: { color: '#64748b', font: { weight: 700 } } }
        }
    };

    const chart = (id, config) => {
        const canvas = document.getElementById(id);
        if (!canvas) {
            return null;
        }
        return new Chart(canvas, config(canvas.getContext('2d')));
    };

    const monthly = rawData.monthly || {};
    chart('monthlyRevenueChart', (ctx) => ({
        type: 'line',
        data: {
            labels: monthly.labels,
            datasets: [{
                label: 'Revenue',
                data: monthly.revenue,
                borderColor: palette.blue,
                backgroundColor: makeGradient(ctx, 'rgba(40, 84, 245, .28)', 'rgba(40, 84, 245, .02)'),
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#fff',
                pointBorderColor: palette.blue,
                tension: .42,
                fill: true
            }]
        },
        options: baseOptions
    }));

    const weekly = pick('weekly', 'revenue');
    chart('weeklySalesChart', () => ({
        type: 'bar',
        data: {
            labels: weekly.labels,
            datasets: [{
                label: 'Sales',
                data: weekly.revenue,
                backgroundColor: [palette.blue, palette.indigo, palette.purple, palette.emerald, palette.amber, palette.sky, palette.red],
                borderRadius: 8,
                maxBarThickness: 38
            }]
        },
        options: { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: false } } }
    }));

    const topProducts = pick('top_products', 'quantity');
    chart('topProductsChart', () => ({
        type: 'bar',
        data: {
            labels: topProducts.labels,
            datasets: [{
                label: 'Units Sold',
                data: topProducts.quantity,
                backgroundColor: palette.emerald,
                borderRadius: 8,
                maxBarThickness: 24
            }]
        },
        options: {
            ...baseOptions,
            indexAxis: 'y',
            plugins: { ...baseOptions.plugins, legend: { display: false } },
            scales: {
                x: baseOptions.scales.y,
                y: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 800 } } }
            }
        }
    }));

    const growth = pick('customer_growth', 'count');
    chart('customerGrowthChart', (ctx) => ({
        type: 'line',
        data: {
            labels: growth.labels,
            datasets: [{
                label: 'Customers',
                data: growth.count,
                borderColor: palette.purple,
                backgroundColor: makeGradient(ctx, 'rgba(139, 92, 246, .26)', 'rgba(139, 92, 246, .03)'),
                borderWidth: 3,
                pointRadius: 3,
                tension: .38,
                fill: true
            }]
        },
        options: { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: false } } }
    }));

    const revenueExpenses = rawData.revenue_expenses || { labels: ['Revenue', 'Expenses', 'Profit'], values: [206750, 118400, 88350] };
    chart('revenueExpenseChart', () => ({
        type: 'bar',
        data: {
            labels: revenueExpenses.labels,
            datasets: [{
                label: 'Amount',
                data: revenueExpenses.values,
                backgroundColor: [palette.blue, palette.red, palette.emerald],
                borderRadius: 8,
                maxBarThickness: 42
            }]
        },
        options: { ...baseOptions, plugins: { ...baseOptions.plugins, legend: { display: false } } }
    }));

    const categories = pick('category_distribution', 'count');
    chart('categoryChart', () => ({
        type: 'doughnut',
        data: {
            labels: categories.labels,
            datasets: [{
                data: categories.count,
                backgroundColor: [palette.blue, palette.purple, palette.emerald, palette.amber, palette.red, palette.sky],
                borderColor: '#fff',
                borderWidth: 4,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            animation: { animateRotate: true, duration: 1100 },
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#64748b', font: { weight: 800 } } },
                tooltip: baseOptions.plugins.tooltip
            }
        }
    }));

    const miniOptions = {
        responsive: true,
        maintainAspectRatio: false,
        events: [],
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { point: { radius: 0 } },
        animation: { duration: 900 }
    };

    const miniSeries = [
        ['kpiRevenue', monthly.revenue || [12, 19, 15, 24, 29, 33], palette.blue],
        ['kpiSales', weekly.revenue || fallback.weekly.revenue, palette.emerald],
        ['kpiCustomers', growth.count || fallback.customer_growth.count, palette.purple],
        ['kpiProducts', [18, 21, 23, 28, 32, 37], palette.indigo],
        ['kpiBills', [6, 9, 8, 12, 16, 14], palette.amber],
        ['kpiStock', [2, 4, 3, 5, 4, 6], palette.red]
    ];

    miniSeries.forEach(([id, values, color]) => {
        chart(id, () => ({
            type: 'line',
            data: {
                labels: values.map((_, index) => index + 1),
                datasets: [{ data: values, borderColor: 'rgba(255,255,255,.92)', backgroundColor: color, borderWidth: 2, tension: .45, fill: false }]
            },
            options: miniOptions
        }));
    });

    document.querySelectorAll('.counter').forEach((node) => {
        const target = Number(String(node.dataset.count || '0').replace(/,/g, ''));
        const isMoney = target % 1 !== 0 || target > 999;
        const duration = 950;
        const start = performance.now();

        const draw = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = target * eased;
            node.textContent = isMoney
                ? `Rs. ${Math.round(value).toLocaleString('en-IN')}`
                : Math.round(value).toLocaleString('en-IN');
            if (progress < 1) {
                requestAnimationFrame(draw);
            }
        };
        requestAnimationFrame(draw);
    });
});
