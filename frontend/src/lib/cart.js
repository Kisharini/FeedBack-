const CART_STORAGE_KEY = "feedback_marketplace_cart";

const emitCartChange = () => {
  window.dispatchEvent(new Event("cartchange"));
};

const normalizeCart = (cart) => ({
  role: cart?.role || null,
  items: Array.isArray(cart?.items) ? cart.items : [],
});

export const getStoredCart = () => {
  try {
    const rawValue = localStorage.getItem(CART_STORAGE_KEY);
    return rawValue ? normalizeCart(JSON.parse(rawValue)) : { role: null, items: [] };
  } catch {
    return { role: null, items: [] };
  }
};

export const getCartForRole = (role) => {
  const cart = getStoredCart();

  if (!role || cart.role !== role) {
    return [];
  }

  return cart.items;
};

export const saveCart = (role, items) => {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      role,
      items,
    })
  );
  emitCartChange();
};

export const clearCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  emitCartChange();
};

export const addCartItem = (role, item) => {
  const currentCart = getStoredCart();
  const baseItems = currentCart.role === role ? currentCart.items : [];
  const existingIndex = baseItems.findIndex(
    (cartItem) => cartItem.listingId === item.listingId
  );

  if (existingIndex >= 0) {
    const updatedItems = [...baseItems];
    updatedItems[existingIndex] = {
      ...updatedItems[existingIndex],
      quantity: updatedItems[existingIndex].quantity + item.quantity,
      snapshot: item.snapshot,
    };
    saveCart(role, updatedItems);
    return updatedItems;
  }

  const updatedItems = [...baseItems, item];
  saveCart(role, updatedItems);
  return updatedItems;
};

export const updateCartItemQuantity = (role, listingId, quantity) => {
  const items = getCartForRole(role)
    .map((item) =>
      item.listingId === listingId
        ? {
            ...item,
            quantity,
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  saveCart(role, items);
  return items;
};

export const removeCartItem = (role, listingId) => {
  const items = getCartForRole(role).filter((item) => item.listingId !== listingId);
  saveCart(role, items);
  return items;
};

export const getCartCount = (role) =>
  getCartForRole(role).reduce((sum, item) => sum + item.quantity, 0);
