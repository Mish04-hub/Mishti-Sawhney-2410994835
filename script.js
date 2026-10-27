const products = [
  { id: 1, name: "Basic T-Shirt", category: "Clothing", price: 499, oldPrice: 599, icon: "👕", color: "#e8f0ec" },
  { id: 2, name: "Canvas Tote Bag", category: "Accessories", price: 349, oldPrice: 449, icon: "👜", color: "#f5e9d8" },
  { id: 3, name: "Everyday Sneakers", category: "Clothing", price: 1499, oldPrice: 1799, icon: "👟", color: "#e9e7f5" },
  { id: 4, name: "Water Bottle", category: "Accessories", price: 299, oldPrice: 399, icon: "🧴", color: "#e2edf7" },
  { id: 5, name: "Coffee Mug", category: "Home", price: 249, oldPrice: 299, icon: "☕", color: "#f5e6e4" },
  { id: 6, name: "Wrist Watch", category: "Accessories", price: 1299, oldPrice: 1599, icon: "⌚", color: "#f1eddf" },
  { id: 7, name: "Decorative Vase", category: "Home", price: 799, oldPrice: 999, icon: "🏺", color: "#f2e8dc" },
  { id: 8, name: "Face Serum", category: "Home", price: 599, oldPrice: 749, icon: "🧴", color: "#e6efe2" }
];
const coupons = {
  SAVE10: { type: "percent", value: 10 },
  SAVE20: { type: "percent", value: 20 },
  FLAT100: { type: "flat", value: 100 }
};
const SHIPPING_FEE = 79;
const FREE_SHIPPING_LIMIT = 2000;
let cart = readCart();
let activeCoupon = null;

const $ = id => document.getElementById(id);
const money = value => "₹" + Math.round(Math.max(0, value)).toLocaleString("en-IN");

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("shopease-simple-cart") || "[]");
    return Array.isArray(saved) ? saved.filter(item => products.some(p => p.id === item.id) && Number(item.quantity) > 0) : [];
  } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem("shopease-simple-cart", JSON.stringify(cart)); } catch {}
}
function subtotalValue() {
  return cart.reduce((sum, item) => sum + products.find(p => p.id === item.id).price * item.quantity, 0);
}
function discountValue() {
  if (!activeCoupon) return 0;
  const subtotal = subtotalValue();
  return Math.min(subtotal, activeCoupon.type === "percent" ? subtotal * activeCoupon.value / 100 : activeCoupon.value);
}
function shippingValue() {
  const afterDiscount = subtotalValue() - discountValue();
  return afterDiscount === 0 || afterDiscount >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_FEE;
}
function totalValue() { return subtotalValue() - discountValue() + shippingValue(); }

function renderProducts() {
  const search = $("search").value.trim().toLowerCase();
  const category = $("category").value;
  const maxPrice = $("priceFilter").value;
  let list = products.filter(p =>
    (p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search)) &&
    (category === "All" || p.category === category) &&
    (maxPrice === "all" || p.price < Number(maxPrice))
  );
  const sort = $("sort").value;
  if (sort === "low") list.sort((a,b) => a.price - b.price);
  if (sort === "high") list.sort((a,b) => b.price - a.price);
  if (sort === "name") list.sort((a,b) => a.name.localeCompare(b.name));
  $("noProducts").classList.toggle("hidden", list.length > 0);
  $("products").innerHTML = list.map(p => `
    <article class="product">
      <div class="product-art" style="background:${p.color}">${p.icon}</div>
      <div class="product-info">
        <span class="category-label">${p.category}</span>
        <h3>${p.name}</h3>
        <div class="price">${money(p.price)} <span class="old-price">${money(p.oldPrice)}</span></div>
        <button class="primary add-button" data-add="${p.id}">Add to Cart</button>
      </div>
    </article>`).join("");
}
function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("cartCount").textContent = count;
  $("cartItems").innerHTML = cart.map(item => {
    const p = products.find(product => product.id === item.id);
    return `<div class="cart-item">
      <div><h3>${p.icon} ${p.name}</h3><p>${money(p.price)} each</p>
        <div class="qty"><button data-qty="${p.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-qty="${p.id}" data-change="1" aria-label="Increase quantity">+</button></div>
      </div>
      <button class="remove" data-remove="${p.id}">Remove</button>
    </div>`;
  }).join("");
  $("emptyCart").classList.toggle("hidden", cart.length > 0);
  $("cartSummary").classList.toggle("hidden", cart.length === 0);
  $("subtotal").textContent = money(subtotalValue());
  $("discount").textContent = "−" + money(discountValue());
  $("shipping").textContent = shippingValue() === 0 ? "Free" : money(shippingValue());
  $("total").textContent = money(totalValue());
  $("checkoutTotal").textContent = money(totalValue());
  if (cart.length === 0) activeCoupon = null;
}
function addToCart(id) {
  const item = cart.find(item => item.id === Number(id));
  if (item) item.quantity += 1;
  else cart.push({ id: Number(id), quantity: 1 });
  saveCart(); renderCart();
}
function changeQuantity(id, change) {
  const item = cart.find(item => item.id === Number(id));
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter(i => i.id !== Number(id));
  saveCart(); renderCart();
}
function applyCoupon() {
  const code = $("coupon").value.trim().toUpperCase();
  const message = $("couponMessage");
  if (!cart.length) {
    message.textContent = "Add a product before applying a coupon.";
    message.className = "error";
  } else if (!coupons[code]) {
    activeCoupon = null;
    message.textContent = "Invalid coupon. Try SAVE10, SAVE20 or FLAT100.";
    message.className = "error";
  } else {
    activeCoupon = coupons[code];
    message.textContent = code + " applied successfully!";
    message.className = "success";
  }
  renderCart();
}
function showCart() { $("cartPanel").classList.remove("hidden"); }
function hideCart() { $("cartPanel").classList.add("hidden"); }
function showCheckout() {
  if (!cart.length) return alert("Your cart is empty. Add a product first.");
  hideCart();
  $("checkoutTotal").textContent = money(totalValue());
  $("checkoutPanel").classList.remove("hidden");
}
function hideCheckout() { $("checkoutPanel").classList.add("hidden"); }

$("products").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});
$("cartItems").addEventListener("click", event => {
  const qty = event.target.closest("[data-qty]");
  const remove = event.target.closest("[data-remove]");
  if (qty) changeQuantity(Number(qty.dataset.qty), Number(qty.dataset.change));
  if (remove) {
    cart = cart.filter(item => item.id !== Number(remove.dataset.remove));
    saveCart(); renderCart();
  }
});
["search", "category", "priceFilter", "sort"].forEach(id => {
  $(id).addEventListener(id === "search" ? "input" : "change", renderProducts);
});
$("openCart").addEventListener("click", showCart);
$("closeCart").addEventListener("click", hideCart);
$("applyCoupon").addEventListener("click", applyCoupon);
$("coupon").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); applyCoupon(); } });
$("checkout").addEventListener("click", showCheckout);
$("closeCheckout").addEventListener("click", hideCheckout);
$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = new FormData(event.target).get("name");
  const orderId = "SE" + Date.now().toString().slice(-6);
  alert(`Thank you, ${name}! Demo order ${orderId} placed successfully. No payment was collected.`);
  cart = [];
  activeCoupon = null;
  saveCart();
  renderCart();
  event.target.reset();
  $("coupon").value = "";
  $("couponMessage").textContent = "Try SAVE10, SAVE20 or FLAT100.";
  $("couponMessage").className = "";
  hideCheckout();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") { hideCart(); hideCheckout(); }
});

renderProducts();
renderCart();
