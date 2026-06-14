document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    if (window.AOS) {
        AOS.init({
            duration: 650,
            easing: 'ease-out-cubic',
            once: true,
            offset: 60
        });
    }

    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
    const applyTheme = (theme) => {
        document.body.classList.toggle('theme-dark', theme === 'dark');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
        }
        localStorage.setItem('smartBillingTheme', theme);
    };
    applyTheme(localStorage.getItem('smartBillingTheme') || 'light');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            applyTheme(document.body.classList.contains('theme-dark') ? 'light' : 'dark');
        });
    }

    const clock = document.getElementById('currentClock');
    const dashboardClock = document.getElementById('dashboardClock');
    const tick = () => {
        const now = new Date();
        if (clock) {
            clock.textContent = new Intl.DateTimeFormat('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(now);
        }
        if (dashboardClock) {
            dashboardClock.textContent = new Intl.DateTimeFormat('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }).format(now);
        }
    };
    tick();
    setInterval(tick, 1000);

    document.querySelectorAll('.flash-message').forEach((node) => {
        Swal.fire({
            icon: node.dataset.level === 'error' ? 'error' : 'success',
            title: node.dataset.message,
            timer: 1800,
            showConfirmButton: false
        });
    });

    if (window.jQuery && $.fn.DataTable) {
        $('.data-table').each(function () {
            const table = $(this);
            if (!table.find('tbody tr').length || table.find('tbody td[colspan]').length) {
                return;
            }
            table.DataTable({
                pageLength: 6,
                lengthChange: false,
                responsive: true,
                order: [],
                language: {
                    search: '',
                    searchPlaceholder: 'Search records'
                }
            });
        });
    }
});
