import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { Cart } from './components/Cart';
import { MenuItemModal } from './components/MenuItemModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { MenuItem, CartItem, CustomizationOptionChoice, AdminOrder } from './types';
import { AIChat } from './components/AIChat';
import { getMenuItems, getTestimonials, placeOrder } from './services/api';

// Define a type for the checkout details collected by the AI or Modal
export interface CheckoutDetails {
  name: string;
  address: string;
  phone: string;
  paymentMethod: string;
  tip: number;
}

export function PublicApp() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Fetch initial data from the API service
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [fetchedMenuItems, fetchedTestimonials] = await Promise.all([
          getMenuItems(),
          getTestimonials(),
        ]);
        setMenuItems(fetchedMenuItems);
        setTestimonials(fetchedTestimonials);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        // Optionally set an error state here
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOpenCart = useCallback(() => setIsCartOpen(true), []);
  const handleCloseCart = useCallback(() => setIsCartOpen(false), []);
  const handleOpenModal = useCallback((item: MenuItem) => setSelectedItem(item), []);
  const handleCloseModal = useCallback(() => setSelectedItem(null), []);

  const handleOpenCheckout = useCallback(() => {
    if (cartItems.length > 0) {
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    }
  }, [cartItems.length]);

  const handleCloseCheckout = useCallback(() => setIsCheckoutOpen(false), []);
  
  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handlePlaceOrder = useCallback(async (details: CheckoutDetails) => {
    console.log("Placing order with details:", details);
    try {
        await placeOrder(cartItems, details as any); // Using 'as any' to match the simplified backend details
        handleClearCart();
        setIsCheckoutOpen(false);
        setIsOrderComplete(true);
    } catch (error) {
        console.error("Failed to place order:", error);
        alert("Hubo un problema al procesar tu pedido. Por favor, intenta de nuevo.");
    }
  }, [cartItems, handleClearCart]);

  useEffect(() => {
    if (isOrderComplete) {
      const timer = setTimeout(() => {
        setIsOrderComplete(false);
      }, 4000); // Hide confirmation after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [isOrderComplete]);

  const handleAddToCart = useCallback((item: MenuItem, quantity: number, customizations: Record<string, CustomizationOptionChoice>, totalPrice: number) => {
    setCartItems(prevItems => [
      ...prevItems,
      {
        id: `${item.id}-${Date.now()}`,
        menuItem: item,
        quantity,
        customizations,
        totalPrice,
      }
    ]);
    handleCloseModal();
    handleOpenCart();
  }, [handleCloseModal, handleOpenCart]);

  const handleAiAddToCart = useCallback((cartItem: CartItem) => {
        setCartItems(prevItems => [...prevItems, cartItem]);
        handleOpenCart();
  }, [handleOpenCart]);


  const handleUpdateCart = useCallback((updatedCart: CartItem[]) => {
    setCartItems(updatedCart);
  }, []);


  return (
    <div className="font-sans text-dark bg-light min-h-screen">
      <Header onCartClick={handleOpenCart} cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} />
      <main>
        <Hero />
        {isLoading ? (
             <div className="text-center py-24">Cargando menú...</div>
        ) : (
             <MenuSection menuItems={menuItems} onCustomizeClick={handleOpenModal} />
        )}
        <Testimonials testimonials={testimonials}/>
      </main>
      <Footer />
      <Cart 
        isOpen={isCartOpen} 
        onClose={handleCloseCart} 
        items={cartItems} 
        onUpdateCart={handleUpdateCart}
        onCheckout={handleOpenCheckout}
      />
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={handleCloseCheckout}
          items={cartItems}
          onPlaceOrder={handlePlaceOrder}
        />
      )}
      {isOrderComplete && <OrderConfirmationModal />}
      <AIChat 
        menuItems={menuItems}
        cartItems={cartItems}
        onAddToCart={handleAiAddToCart}
        onPlaceOrder={handlePlaceOrder}
        onOpenCart={handleOpenCart}
        onClearCart={handleClearCart}
      />
    </div>
  );
}