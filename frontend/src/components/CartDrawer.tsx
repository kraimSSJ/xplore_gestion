import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api, { downloadOrderPdf, resolveAssetUrl } from '../api/client';

export default function CartDrawer() {
  const {
    lines,
    isOpen,
    closeCart,
    openCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleExport() {
    if (lines.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/orders', {
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      clearCart();
      closeCart();
      navigate('/my-orders');
      // trigger a PDF download immediately (authenticated)
      downloadOrderPdf(res.data.id);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to export order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <button className="cart-fab" onClick={openCart}>
          Cart
          {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
        </button>
      )}

      {isOpen && <div className="cart-overlay" onClick={closeCart} />}

      <div className={`cart-drawer${isOpen ? ' open' : ''}`}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="icon-btn" onClick={closeCart}>
            Close
          </button>
        </div>

        <div className="cart-items">
          {lines.length === 0 && (
            <div className="empty-state">Your cart is empty. Browse the catalog to add products.</div>
          )}
          {lines.map((line) => (
            <div className="cart-item" key={line.product.id}>
              {line.product.photoUrl ? (
                <img src={resolveAssetUrl(line.product.photoUrl)} alt={line.product.name} />
              ) : (
                <div className="cart-item" style={{ width: 52, height: 52, background: '#F4F6FA', borderRadius: 8 }} />
              )}
              <div className="cart-item-info">
                <div className="cart-item-name">{line.product.name}</div>
                <div className="cart-item-price">
                  ¥{line.product.priceRmb.toFixed(2)} (≈ {line.product.priceMad.toFixed(2)} MAD) each
                </div>
                <div className="qty-stepper" style={{ marginTop: 6 }}>
                  <button onClick={() => updateQuantity(line.product.id, line.quantity - 1)}>-</button>
                  <span>{line.quantity}</span>
                  <button onClick={() => updateQuantity(line.product.id, line.quantity + 1)}>+</button>
                </div>
              </div>
              <button className="icon-btn" onClick={() => removeFromCart(line.product.id)}>
                &times;
              </button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          {error && <div className="error-banner">{error}</div>}
          <div className="cart-total-row">
            <span>Total</span>
            <span>{totalPrice.toFixed(2)} MAD</span>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={lines.length === 0 || submitting}
            onClick={handleExport}
          >
            {submitting ? 'Exporting...' : 'Export to PDF'}
          </button>
        </div>
      </div>
    </>
  );
}