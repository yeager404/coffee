import { useEffect, useState } from "react";
import { useContext, createContext } from "react";

const cartContext = createContext(null);

export function CartProvider({ children }) {

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  function addToCart(coffee) {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === coffee.id);

      if (existing) {
        return prevCart.map(item =>
          item.id === coffee.id ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prevCart, { ...coffee, qty: 1 }];
    });
  }


  function incrementItem(id) {
    setCart((prevCart) => prevCart.map(
      (item) => item.id === id ? { ...item, qty: item.qty + 1 }
        : item
    ));
  }


  function decrementItem(id) {
    setCart((prevCart) => prevCart.map((item) =>
      item.id === id ? { ...item, qty: item.qty - 1 }
        : item).filter((item) => item.qty > 0));
  }


  function clearCart() {
    setCart([]);
  }

  const value = {
    cart,
    addToCart,
    incrementItem,
    decrementItem,
    clearCart,
  };

  return (
    <cartContext.Provider value={value}>
      {children}
    </cartContext.Provider>
  );

}

export function useCart() {
  const context = useContext(cartContext);

  if (!context) {
    throw new Error("useCart must be inside CartProvider");
  }

  return context;
}
