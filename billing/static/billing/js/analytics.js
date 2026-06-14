document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(document.getElementById('analyticsData').textContent);
    const categories = data.category_distribution || [];
    new Chart(document.getElementById('revenueTrendChart'), {
        type: 'line',
        data: { labels: data.monthly.labels, datasets: [{ label: 'Revenue', data: data.monthly.revenue, borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,.12)', fill: true, tension: .35 }] },
        options: { scales: { y: { beginAtZero: true } } }
    });
    new Chart(document.getElementById('productPerformanceChart'), {
        type: 'bar',
        data: { labels: data.top_products.labels, datasets: [{ label: 'Quantity', data: data.top_products.quantity, backgroundColor: '#159947' }] },
        options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
    });
    new Chart(document.getElementById('profitChart'), {
        type: 'bar',
        data: { labels: data.monthly.labels, datasets: [
            { label: 'Revenue', data: data.monthly.revenue, backgroundColor: '#0d6efd' },
            { label: 'Profit', data: data.monthly.profit, backgroundColor: '#b7791f' }
        ] },
        options: { scales: { y: { beginAtZero: true } } }
    });
    new Chart(document.getElementById('analyticsCategoryChart'), {
        type: 'doughnut',
        data: {
            labels: categories.map((row) => row.category__name || 'Uncategorized'),
            datasets: [{ data: categories.map((row) => row.count), backgroundColor: ['#0d6efd', '#159947', '#dc3545', '#b7791f', '#6f42c1'] }]
        }
    });
});
