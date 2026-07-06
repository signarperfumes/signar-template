<body>
                            

              <script>
                              /* ============================================
   SIGNAR THEME — Master JavaScript
   ============================================ */

(function() {
  'use strict';

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', function() {
    initLoader();
    initHeader();
    initMobileMenu();
    initQuickAdd();
    initCartDrawer();
    initProductPage();
    initReveal();
    initCursor();
  });

  /* ============================================
     Loader
     ============================================ */
  function initLoader() {
    window.addEventListener('load', function() {
      setTimeout(function() {
        var loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
      }, 1200);
    });
  }

  /* ============================================
     Header Scroll Effect
     ============================================ */
  function initHeader() {
    var header = document.getElementById('signarHeader');
    if (!header) return;

    var scrollThreshold = 80;

    function handleScroll() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /* ============================================
     Mobile Menu
     ============================================ */
  function initMobileMenu() {
    var hamburgerBtn = document.getElementById('hamburgerBtn');
    var mobileMenu = document.getElementById('mobileMenu');
    var mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    var mobileMenuClose = document.getElementById('mobileMenuClose');

    if (!hamburgerBtn || !mobileMenu) return;

    function toggleMobileMenu() {
      var isActive = mobileMenu.classList.contains('active');

      if (isActive) {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
      } else {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        hamburgerBtn.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('no-scroll');
      }
    }

    hamburgerBtn.addEventListener('click', toggleMobileMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', toggleMobileMenu);
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', toggleMobileMenu);

    // Accordion menus
    document.querySelectorAll('.mobile-nav-toggle').forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        var submenu = toggle.nextElementSibling;

        toggle.setAttribute('aria-expanded', !isExpanded);

        if (!isExpanded) {
          submenu.classList.add('active');
        } else {
          submenu.classList.remove('active');
        }
      });
    });

    // Close on link click
    document.querySelectorAll('.mobile-nav-link, .mobile-submenu-link').forEach(function(link) {
      link.addEventListener('click', function() {
        if (mobileMenu.classList.contains('active')) toggleMobileMenu();
      });
    });

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggleMobileMenu();
      }
    });
  }

  /* ============================================
     Quick Add to Cart
     ============================================ */
  function initQuickAdd() {
    document.querySelectorAll('.signar-product-card__quick-add:not([disabled])').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var variantId = btn.dataset.variantId;
        var originalText = btn.querySelector('span').textContent;

        btn.querySelector('span').textContent = 'Adding...';

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        })
        .then(function(response) {
          if (response.ok) {
            btn.querySelector('span').textContent = 'Added ✓';
            btn.classList.add('added');

            var cartCountEl = document.querySelector('.cart-count');
            if (cartCountEl) {
              var currentCount = parseInt(cartCountEl.textContent) || 0;
              cartCountEl.textContent = currentCount + 1;
              cartCountEl.style.display = 'flex';
            }

            showToast('Added to bag');

            setTimeout(function() {
              btn.querySelector('span').textContent = originalText;
              btn.classList.remove('added');
            }, 1500);
          }
        })
        .catch(function() {
          btn.querySelector('span').textContent = 'Error';
          setTimeout(function() {
            btn.querySelector('span').textContent = originalText;
          }, 1500);
        });
      });
    });
  }

  /* ============================================
     Cart Drawer
     ============================================ */
  function initCartDrawer() {
    var cartDrawer = document.getElementById('cartDrawer');
    var cartDrawerClose = document.getElementById('cartDrawerClose');
    var cartDrawerContinue = document.getElementById('cartDrawerContinue');

    if (!cartDrawer) return;

    // Expose open function globally
    window.openCartDrawer = function() {
      cartDrawer.classList.add('active');
      document.body.classList.add('no-scroll');
    };

    function closeCartDrawer() {
      cartDrawer.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }

    if (cartDrawerClose) cartDrawerClose.addEventListener('click', closeCartDrawer);
    if (cartDrawerContinue) cartDrawerContinue.addEventListener('click', closeCartDrawer);

    // Quantity update
    document.querySelectorAll('.cart-drawer-item-quantity .qty-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var line = btn.dataset.line;
        var action = btn.dataset.action;
        var item = cartDrawer.querySelector('[data-line="' + line + '"]');
        var qtyValue = item.querySelector('.qty-value');
        var currentQty = parseInt(qtyValue.textContent);

        var newQty = action === 'increase' ? currentQty + 1 : currentQty - 1;

        if (newQty <= 0) {
          fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line: line, quantity: 0 })
          }).then(function() { item.remove(); });
        } else {
          fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ line: line, quantity: newQty })
          }).then(function() { qtyValue.textContent = newQty; });
        }

        setTimeout(function() { location.reload(); }, 500);
      });
    });

    // Remove item
    document.querySelectorAll('.remove-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var line = btn.dataset.line;
        var item = cartDrawer.querySelector('[data-line="' + line + '"]');

        fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line: line, quantity: 0 })
        }).then(function() { item.remove(); });

        setTimeout(function() { location.reload(); }, 500);
      });
    });

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && cartDrawer.classList.contains('active')) {
        closeCartDrawer();
      }
    });
  }

  /* ============================================
     Product Page (Variant Selection, Zoom, Qty)
     ============================================ */
  function initProductPage() {
    var productDataEl = document.getElementById('productData');
    if (!productDataEl) return;

    var productData;
    try {
      productData = JSON.parse(productDataEl.textContent);
    } catch (e) {
      return;
    }

    var select = document.querySelector('.variant-select');
    var addToCartBtn = document.getElementById('addToCartBtn');
    var selectedOptions = {};

    // Variant selection
    document.querySelectorAll('.option-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var position = btn.dataset.optionPosition;
        var value = btn.dataset.value;

        document.querySelectorAll('.option-btn[data-option-position="' + position + '"]').forEach(function(b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');

        selectedOptions[position] = value;

        var matchingVariant = productData.variants.find(function(v) {
          return v.options.every(function(opt, idx) {
            return !selectedOptions[idx + 1] || selectedOptions[idx + 1] === opt;
          });
        });

        if (matchingVariant && select) {
          select.value = matchingVariant.id;
          if (addToCartBtn) {
            addToCartBtn.disabled = !matchingVariant.available;
            var btnText = addToCartBtn.querySelector('.btn-text');
            var btnPrice = addToCartBtn.querySelector('.btn-price');
            if (btnText) btnText.textContent = 'Add to Bag';
            if (btnPrice) btnPrice.textContent = '— ' + Shopify.formatMoney(matchingVariant.price, '{{ shop.currency }}');
          }
        }
      });
    });

    // Quantity selector
    var qty = 1;
    var qtyValue = document.getElementById('qtyValue');
    var qtyInput = document.getElementById('quantityInput');
    var qtyMinus = document.getElementById('qtyMinus');
    var qtyPlus = document.getElementById('qtyPlus');

    if (qtyMinus) {
      qtyMinus.addEventListener('click', function() {
        if (qty > 1) {
          qty--;
          if (qtyValue) qtyValue.textContent = qty;
          if (qtyInput) qtyInput.value = qty;
        }
      });
    }

    if (qtyPlus) {
      qtyPlus.addEventListener('click', function() {
        qty++;
        if (qtyValue) qtyValue.textContent = qty;
        if (qtyInput) qtyInput.value = qty;
      });
    }

    // Image zoom
    var gallery = document.getElementById('productGallery');
    var mainImage = document.getElementById('mainImage');

    if (gallery && mainImage) {
      gallery.addEventListener('click', function(e) {
        if (e.target.closest('.thumbnail-btn')) return;
        gallery.classList.toggle('zoomed');
        if (gallery.classList.contains('zoomed')) {
          var rect = gallery.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          mainImage.style.transformOrigin = ((x / rect.width) * 100) + '% ' + ((y / rect.height) * 100) + '%';
        } else {
          mainImage.style.transformOrigin = 'center center';
        }
      });
    }

    // Thumbnail selection
    document.querySelectorAll('.thumbnail-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.thumbnail-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var img = btn.querySelector('img');
        if (img && mainImage) {
          mainImage.src = img.src.replace('width=200', 'width=1200');
        }
      });
    });

    // Wishlist button
    var wishlistBtn = document.querySelector('.wishlist-btn');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', function() {
        showToast('Added to wishlist');
      });
    }
  }

  /* ============================================
     Reveal on Scroll
     ============================================ */
  function initReveal() {
    var reveals = document.querySelectorAll('.reveal:not(.active)');
    if (!reveals.length) return;

    var revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

    reveals.forEach(function(el) { revealObserver.observe(el); });
  }

  /* ============================================
     Custom Cursor
     ============================================ */
  function initCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var cursor = document.querySelector('.cursor');
    var cursorDot = document.querySelector('.cursor-dot');

    if (!cursor || !cursorDot) return;

    document.addEventListener('mousemove', function(e) {
      cursor.style.left = (e.clientX - 16) + 'px';
      cursor.style.top = (e.clientY - 16) + 'px';
      cursorDot.style.left = (e.clientX - 2.5) + 'px';
      cursorDot.style.top = (e.clientY - 2.5) + 'px';
    });

    var hoverables = 'a, button, input, select, textarea, .product-card, .collection-card, .also-like-card';

    document.addEventListener('mouseover', function(e) {
      if (e.target.closest(hoverables)) cursor.classList.add('hover');
    });

    document.addEventListener('mouseout', function(e) {
      if (e.target.closest(hoverables)) cursor.classList.remove('hover');
    });
  }

  /* ============================================
     Toast Notification
     ============================================ */
  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function() {
      toast.classList.remove('show');
    }, 2000);
  }

  // Expose globally for inline handlers
  window.showToast = showToast;

})();


              </script>
                        </body>
                        </html>
                    
