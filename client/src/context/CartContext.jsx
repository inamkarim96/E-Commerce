import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('naturadry_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('naturadry_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1, weight = null) => {
    const weightLabel = typeof weight === 'string' ? weight : (weight?.label || 'Default');
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === product.id && 
        (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel)
      );

      if (existingItem) {
        return prevCart.map(item =>
          (item.id === product.id && (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel))
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      // Store the weight object and set the active price
      const price = weight?.price || product.base_price;
      return [...prevCart, { ...product, quantity, selectedWeight: weight || weightLabel, price }];
    });
  };

  const removeFromCart = (productId, weight) => {
    const weightLabel = typeof weight === 'string' ? weight : (weight?.label || 'Default');
    setCart(prevCart => prevCart.filter(item => 
      !(item.id === productId && (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel))
    ));
  };

  const updateQuantity = (productId, weight, quantity) => {
    if (quantity < 1) return;
    const weightLabel = typeof weight === 'string' ? weight : (weight?.label || 'Default');
    setCart(prevCart => prevCart.map(item =>
      (item.id === productId && (item.selectedWeight?.label === weightLabel || item.selectedWeight === weightLabel))
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = Number(item.price || item.base_price || 0);
    return sum + (itemPrice * item.quantity);
  }, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      subtotal,
      totalItems,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
