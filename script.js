const API_URL = 'https://api.escuelajs.co/api/v1/products';

let allProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortBy = null; // 'price' | 'title'
let sortOrder = 'asc'; // 'asc' | 'desc'

function createProductRow(product) {
    let images = product.images;
    if (typeof images === 'string') {
        try {
            images = JSON.parse(images);
        } catch {
            images = images ? [images] : [];
        }
    }
    images = Array.isArray(images) ? images : [];
    const safeTitle = (product.title || '').replace(/"/g, '&quot;');
    const imagesHtml = images
        .filter((url) => url && typeof url === 'string')
        .map(
            (url) =>
                `<img src="${url.replace(/"/g, '')}" alt="${safeTitle}" class="product-img" loading="lazy" referrerpolicy="no-referrer" />`
        )
        .join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${product.id}</td>
        <td class="images-cell">
            <div class="product-images">${imagesHtml || '-'}</div>
        </td>
        <td>${product.title}</td>
        <td>$${product.price}</td>
        <td>${product.category?.name || '-'}</td>
    `;
    return tr;
}

function getPaginatedSlice(products) {
    const total = products.length;
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
        slice: products.slice(start, end),
        total,
        totalPages,
        page,
        start: total === 0 ? 0 : start + 1,
        end: Math.min(end, total)
    };
}

function renderProducts(products) {
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '';

    const { slice, total, totalPages, page, start, end } = getPaginatedSlice(products);

    slice.forEach((product) => {
        tbody.appendChild(createProductRow(product));
    });

    document.getElementById('pagination-info').textContent =
        total === 0 ? 'Không có dữ liệu' : `Hiển thị ${start}–${end} trong ${total} sản phẩm`;

    renderPaginationButtons(totalPages, page);
}

function renderPaginationButtons(totalPages, page) {
    const container = document.getElementById('pagination-buttons');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'pagination-btn';
    prev.textContent = 'Trước';
    prev.disabled = page <= 1;
    prev.addEventListener('click', () => {
        if (page > 1) {
            currentPage = page - 1;
            renderProducts(getFilteredAndSortedProducts());
        }
    });
    container.appendChild(prev);

    const maxVisible = 5;
    let from = Math.max(1, page - Math.floor(maxVisible / 2));
    let to = Math.min(totalPages, from + maxVisible - 1);
    if (to - from + 1 < maxVisible) from = Math.max(1, to - maxVisible + 1);

    for (let i = from; i <= to; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pagination-btn' + (i === page ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderProducts(getFilteredAndSortedProducts());
        });
        container.appendChild(btn);
    }

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'pagination-btn';
    next.textContent = 'Sau';
    next.disabled = page >= totalPages;
    next.addEventListener('click', () => {
        if (page < totalPages) {
            currentPage = page + 1;
            renderProducts(getFilteredAndSortedProducts());
        }
    });
    container.appendChild(next);
}

function filterByTitle(keyword) {
    const q = (keyword || '').trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((p) =>
        (p.title || '').toLowerCase().includes(q)
    );
}

function sortProducts(products) {
    if (!sortBy) return [...products];
    const arr = [...products];
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'price') {
        arr.sort((a, b) => order * ((a.price ?? 0) - (b.price ?? 0)));
    } else if (sortBy === 'title') {
        arr.sort((a, b) => {
            const x = (a.title || '').toLowerCase();
            const y = (b.title || '').toLowerCase();
            return order * x.localeCompare(y);
        });
    }
    return arr;
}

function getFilteredAndSortedProducts() {
    const filtered = filterByTitle(document.getElementById('search-input').value);
    return sortProducts(filtered);
}

async function getAll() {
    const loading = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const searchInput = document.getElementById('search-input');

    loading.textContent = 'Đang tải...';
    errorEl.classList.add('hidden');

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status}`);
        }

        allProducts = await response.json();
        loading.textContent = '';

        const perPageSelect = document.getElementById('per-page');
        itemsPerPage = parseInt(perPageSelect.value, 10);
        currentPage = 1;

        const applyFilterAndRender = () => {
            currentPage = 1;
            renderProducts(getFilteredAndSortedProducts());
        };

        const setSort = (by, order) => {
            sortBy = by;
            sortOrder = order;
            currentPage = 1;
            renderProducts(getFilteredAndSortedProducts());
            document.querySelectorAll('.sort-btn').forEach((b) => b.classList.remove('active'));
            const activeId = by === 'price' ? (order === 'asc' ? 'sort-price-asc' : 'sort-price-desc') : (order === 'asc' ? 'sort-name-asc' : 'sort-name-desc');
            const activeBtn = document.getElementById(activeId);
            if (activeBtn) activeBtn.classList.add('active');
        };

        document.getElementById('sort-price-asc').addEventListener('click', () => setSort('price', 'asc'));
        document.getElementById('sort-price-desc').addEventListener('click', () => setSort('price', 'desc'));
        document.getElementById('sort-name-asc').addEventListener('click', () => setSort('title', 'asc'));
        document.getElementById('sort-name-desc').addEventListener('click', () => setSort('title', 'desc'));

        renderProducts(getFilteredAndSortedProducts());

        perPageSelect.addEventListener('change', () => {
            itemsPerPage = parseInt(perPageSelect.value, 10);
            currentPage = 1;
            renderProducts(getFilteredAndSortedProducts());
        });

        searchInput.onchange = applyFilterAndRender;
        searchInput.oninput = applyFilterAndRender;
    } catch (err) {
        loading.textContent = '';
        errorEl.textContent = err.message || 'Không thể tải dữ liệu';
        errorEl.classList.remove('hidden');
    }
}

getAll();
