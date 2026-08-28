import './style.css'

interface Rating { rate: number; count: number }
interface Product {
  id: number
  title: string
  price: number
  category: string
  description: string
  image: string
  rating: Rating
}
type SortMode = 'featured' | 'price-low' | 'price-high' | 'alphabetical'
interface AppState {
  products: Product[]
  query: string
  selectedCategory: string
  sortMode: SortMode
  status: 'loading' | 'ready' | 'error'
}

const API_URL = 'https://fakestoreapi.com/products'
const STORAGE_KEY = 'shopExplorer-search'
const state: AppState = {
  products: [],
  query: localStorage.getItem(STORAGE_KEY) ?? '',
  selectedCategory: 'all',
  sortMode: 'featured',
  status: 'loading',
}

const app = document.querySelector<HTMLElement>('#app')
if (!app) throw new Error('App root element not found')

const searchIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>`
const chevronIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"></path></svg>`

app.innerHTML = `
  <a class="skip-link" href="#products">Skip to products</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="#top" aria-label="ShopExplorer home">
        <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6.5 8.5h11l-.7 10H7.2l-.7-10Z"></path><path d="M9.5 9V7a2.5 2.5 0 0 1 5 0v2"></path></svg></span>
        <span>Shop<span>Explorer</span></span>
      </a>
      <nav class="main-nav" aria-label="Primary navigation">
        <a class="active" href="#products">Products</a><a href="#filters">Categories</a><a href="#about">About</a>
      </nav>
      <label class="header-search" for="product-search">
        ${searchIcon}<span class="sr-only">Search products by name</span>
        <input id="product-search" type="search" placeholder="Search products" autocomplete="off" /><kbd aria-hidden="true">/</kbd>
      </label>
    </div>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow">Curated for everyday life</p>
        <h1 id="page-title">Find something<br /><em>remarkable.</em></h1>
        <p class="hero-description">Explore a considered collection of essentials, statement pieces, and clever finds—all in one place.</p>
        <a class="browse-link" href="#products">Browse collection <span aria-hidden="true">↓</span></a>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div>
        <div class="hero-shape shape-one"></div><div class="hero-shape shape-two"></div>
        <span class="hero-spark spark-one">✦</span><span class="hero-spark spark-two">✦</span><span class="hero-word">EXPLORE</span>
      </div>
    </section>

    <section class="catalog" id="products" aria-labelledby="catalog-title">
      <div class="catalog-heading">
        <div><p class="eyebrow">The collection</p><h2 id="catalog-title">Explore our products</h2></div>
        <p id="result-count" class="result-count" aria-live="polite"></p>
      </div>
      <div class="filter-bar" id="filters" aria-label="Product filters">
        <div class="field-group"><label for="category-filter">Category</label><div class="select-wrap"><select id="category-filter"><option value="all">All categories</option></select>${chevronIcon}</div></div>
        <div class="field-group"><label for="sort-filter">Sort by</label><div class="select-wrap"><select id="sort-filter"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="alphabetical">Name: A to Z</option></select>${chevronIcon}</div></div>
      </div>
      <div id="loading-state" class="status-card" role="status" aria-live="polite"><span class="spinner" aria-hidden="true"></span><div><strong>Loading products</strong><span>Finding the good stuff for you…</span></div></div>
      <div id="error-state" class="status-card status-card--error" role="alert" hidden><div><strong>Unable to load products.</strong><span>Please check your connection and try again.</span></div><button id="retry-button" type="button">Try again</button></div>
      <div id="empty-state" class="empty-state" hidden><span aria-hidden="true">⌕</span><h3>No products found</h3><p>Try a different search or category.</p><button id="clear-filters" type="button">Clear filters</button></div>
      <div id="product-grid" class="product-grid" aria-live="polite" aria-busy="true"></div>
    </section>

    <section id="about" class="about-strip" aria-label="About ShopExplorer"><p>Thoughtful finds. Simple browsing.</p><span>Independent discovery, made effortless.</span></section>
  </main>
  <footer class="site-footer"><a class="brand brand--footer" href="#top"><span class="brand-mark" aria-hidden="true">S</span><span>Shop<span>Explorer</span></span></a><p>© ${new Date().getFullYear()} ShopExplorer</p></footer>
  <div id="product-modal" class="modal" hidden><div class="modal-backdrop" data-close-modal></div><div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><button class="modal-close" type="button" aria-label="Close product details" data-close-modal>×</button><div id="modal-content"></div></div></div>
`

const getElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing required element: ${selector}`)
  return element
}
const elements = {
  search: getElement<HTMLInputElement>('#product-search'), category: getElement<HTMLSelectElement>('#category-filter'),
  sort: getElement<HTMLSelectElement>('#sort-filter'), grid: getElement<HTMLDivElement>('#product-grid'),
  count: getElement<HTMLParagraphElement>('#result-count'), loading: getElement<HTMLDivElement>('#loading-state'),
  error: getElement<HTMLDivElement>('#error-state'), empty: getElement<HTMLDivElement>('#empty-state'),
  retry: getElement<HTMLButtonElement>('#retry-button'), clear: getElement<HTMLButtonElement>('#clear-filters'),
  modal: getElement<HTMLDivElement>('#product-modal'), modalDialog: getElement<HTMLDivElement>('.modal-dialog'),
  modalContent: getElement<HTMLDivElement>('#modal-content'),
}
elements.search.value = state.query

const escapeHtml = (value: string): string => {
  const node = document.createElement('div'); node.textContent = value; return node.innerHTML
}
const formatCategory = (category: string): string => category.replace(/\b\w/g, (character) => character.toUpperCase())
const formatPrice = (price: number): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

const renderCategoryOptions = (): void => {
  const categories = [...new Set(state.products.map(({ category }) => category))].sort()
  elements.category.innerHTML = ['<option value="all">All categories</option>', ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(formatCategory(category))}</option>`)].join('')
  elements.category.value = state.selectedCategory
}

const getVisibleProducts = (): Product[] => {
  const query = state.query.trim().toLocaleLowerCase()
  const filtered = state.products.filter(({ title, category }) => title.toLocaleLowerCase().includes(query) && (state.selectedCategory === 'all' || category === state.selectedCategory))
  if (state.sortMode === 'price-low') return [...filtered].sort((a, b) => a.price - b.price)
  if (state.sortMode === 'price-high') return [...filtered].sort((a, b) => b.price - a.price)
  if (state.sortMode === 'alphabetical') return [...filtered].sort((a, b) => a.title.localeCompare(b.title))
  return filtered
}

const createProductCard = ({ id, title, price, category, description, image, rating }: Product): string => {
  const safeTitle = escapeHtml(title)
  return `<article class="product-card">
    <div class="product-image-wrap"><span class="category-pill">${escapeHtml(formatCategory(category))}</span><img src="${escapeHtml(image)}" alt="${safeTitle}" loading="lazy" /></div>
    <div class="product-content"><div class="rating" aria-label="Rated ${rating.rate} out of 5 by ${rating.count} customers"><span aria-hidden="true">★</span> ${rating.rate.toFixed(1)} <small>(${rating.count})</small></div><h3>${safeTitle}</h3><p>${escapeHtml(description)}</p>
    <div class="product-footer"><strong>${formatPrice(price)}</strong><button type="button" data-product-id="${id}" aria-label="View details for ${safeTitle}">View details <span aria-hidden="true">↗</span></button></div></div>
  </article>`
}

const renderProducts = (): void => {
  if (state.status !== 'ready') return
  const visibleProducts = getVisibleProducts()
  elements.grid.innerHTML = visibleProducts.map(createProductCard).join('')
  elements.grid.setAttribute('aria-busy', 'false')
  elements.empty.hidden = visibleProducts.length > 0
  elements.count.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? 'item' : 'items'}`
}

let previouslyFocusedElement: HTMLElement | null = null
const openModal = ({ title, price, category, description, image, rating }: Product): void => {
  previouslyFocusedElement = document.activeElement as HTMLElement
  elements.modalContent.innerHTML = `<div class="modal-image-wrap"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" /></div><div class="modal-copy"><span class="modal-category">${escapeHtml(formatCategory(category))}</span><h2 id="modal-title">${escapeHtml(title)}</h2><div class="modal-rating"><span aria-hidden="true">★</span> ${rating.rate.toFixed(1)} <small>${rating.count} reviews</small></div><p>${escapeHtml(description)}</p><strong class="modal-price">${formatPrice(price)}</strong></div>`
  elements.modal.hidden = false; document.body.classList.add('modal-open'); elements.modalDialog.focus()
}
const closeModal = (): void => { elements.modal.hidden = true; document.body.classList.remove('modal-open'); previouslyFocusedElement?.focus() }

const setLoadingState = (): void => {
  state.status = 'loading'; elements.loading.hidden = false; elements.error.hidden = true; elements.empty.hidden = true
  elements.grid.innerHTML = ''; elements.grid.setAttribute('aria-busy', 'true'); elements.count.textContent = ''
}
const fetchProducts = async (): Promise<void> => {
  setLoadingState()
  try {
    const response = await fetch(API_URL)
    if (!response.ok) throw new Error(`Product request failed with status ${response.status}`)
    const products = (await response.json()) as Product[]
    if (!Array.isArray(products)) throw new Error('The product response was not an array')
    state.products = products; state.status = 'ready'; elements.loading.hidden = true; renderCategoryOptions(); renderProducts()
  } catch (error) {
    console.error('Unable to fetch products:', error); state.status = 'error'; elements.loading.hidden = true; elements.error.hidden = false; elements.grid.setAttribute('aria-busy', 'false')
  }
}

elements.search.addEventListener('input', () => { state.query = elements.search.value; localStorage.setItem(STORAGE_KEY, state.query); renderProducts() })
elements.search.addEventListener('keydown', (event) => { if (event.key === 'Escape') { elements.search.value = ''; state.query = ''; localStorage.removeItem(STORAGE_KEY); renderProducts() } })
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== elements.search) { event.preventDefault(); elements.search.focus() }
  if (event.key === 'Escape' && !elements.modal.hidden) closeModal()
})
elements.category.addEventListener('change', () => { state.selectedCategory = elements.category.value; renderProducts() })
elements.sort.addEventListener('change', () => { state.sortMode = elements.sort.value as SortMode; renderProducts() })
elements.grid.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-product-id]')
  if (!button) return
  const product = state.products.find(({ id }) => id === Number(button.dataset.productId)); if (product) openModal(product)
})
elements.modal.addEventListener('click', (event) => { if ((event.target as HTMLElement).closest('[data-close-modal]')) closeModal() })
elements.clear.addEventListener('click', () => {
  state.query = ''; state.selectedCategory = 'all'; elements.search.value = ''; elements.category.value = 'all'; localStorage.removeItem(STORAGE_KEY); renderProducts(); elements.search.focus()
})
elements.retry.addEventListener('click', fetchProducts)
fetchProducts()
