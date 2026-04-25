import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, MoreVertical, Filter, Download, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminManagementStyles } from '../shared/style';
import * as productsApi from '../api/products';
import { toast } from 'react-hot-toast';
import useProducts from '../hooks/useProducts';

const EMPTY_FORM = {
  name: '',
  description: '',
  category_id: '',
  base_price: '',
  stock: '',
  is_featured: false,
  is_active: true,
  weight_variants: [
    { label: '250g', weight_grams: 250, price: '', stock: '' }
  ]
};

const AdminProducts = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
    products, 
    categories, 
    loading, 
    refresh: fetchProducts, 
    setProducts 
  } = useProducts({ 
    isAdmin: true, 
    initialFilters: { limit: 100 } 
  });

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // For new products
  const fileInputRef = useRef(null);

  const handleInitializeCategories = async () => {
    try {
      setSaving(true);
      const res = await productsApi.initializeCategories();
      if (res.success) {
        toast.success(res.data.message);
        window.location.reload(); // Simplest way to refresh both categories and products
      }
    } catch (err) {
      console.error('Failed to initialize categories:', err);
      toast.error('Failed to initialize categories');
    } finally {
      setSaving(false);
    }
  };

  const clearSelectedFiles = () => {
    selectedFiles.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setSelectedFiles([]);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    clearSelectedFiles();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    clearSelectedFiles();
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category?.id || '',
      base_price: product.base_price,
      stock: product.stock,
      is_featured: product.is_featured || false,
      is_active: product.is_active !== false,
      weight_variants: product.weight_variants?.length > 0 
        ? product.weight_variants.map(v => ({...v})) 
        : [{ label: '', weight_grams: '', price: '', stock: '' }]
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        base_price: parseFloat(formData.base_price),
        stock: parseInt(formData.stock) || 0,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        weight_variants: formData.weight_variants.map(v => ({
          label: v.label,
          weight_grams: parseInt(v.weight_grams),
          price: parseFloat(v.price),
          stock: parseInt(v.stock) || 0
        }))
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, payload);
        toast.success('Product updated successfully!');
        setShowModal(false);
      } else {
        const res = await productsApi.createProduct(payload);
        if (res.success) {
          const newProduct = res.data.product;
          
          // Upload pending images if any
          if (selectedFiles.length > 0) {
            toast.loading('Uploading images...', { id: 'img-upload' });
            for (const item of selectedFiles) {
              await productsApi.uploadProductImage(newProduct.id, item.file);
            }
            toast.success('Product created with images!', { id: 'img-upload' });
            clearSelectedFiles();
          } else {
            toast.success('Product created successfully!');
          }
          
          setShowModal(false);
        }
      }

      fetchProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
      toast.error(err?.response?.data?.error || 'Failed to save product', { id: 'img-upload' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error('Failed to delete product');
    }
  };

  const handleStockUpdate = async (id, currentStock) => {
    const newStockStr = window.prompt('Enter new stock quantity:', currentStock);
    if (newStockStr === null) return;
    
    const newStock = parseInt(newStockStr);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }
    
    try {
      await productsApi.updateStock(id, newStock);
      toast.success('Stock updated successfully');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await productsApi.updateProduct(product.id, { is_featured: !product.is_featured });
      toast.success(`Product ${!product.is_featured ? 'featured' : 'un-featured'}`);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update featured status');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await productsApi.updateProduct(product.id, { is_active: !product.is_active });
      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update active status');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (editingProduct) {
      // Direct upload for existing product
      try {
        setUploadingImage(true);
        for (const file of files) {
          await productsApi.uploadProductImage(editingProduct.id, file);
        }
        toast.success('Images uploaded successfully');
        const res = await productsApi.getProduct(editingProduct.id);
        if (res.success) {
          setEditingProduct(res.data);
          fetchProducts();
        }
      } catch (err) {
        toast.error(err?.response?.data?.error || 'Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    } else {
      // Queue for new product
      const newSelected = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...newSelected]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingImage = (index) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!editingProduct || !window.confirm('Remove this image?')) return;
    try {
      await productsApi.deleteProductImage(editingProduct.id, imageUrl);
      toast.success('Image removed');
      const res = await productsApi.getProduct(editingProduct.id);
      if (res.success) setEditingProduct(res.data);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to remove image');
    }
  };

  const addVariantRow = () => {
    setFormData(prev => ({
      ...prev,
      weight_variants: [
        ...prev.weight_variants,
        { label: '', weight_grams: '', price: '', stock: '' }
      ]
    }));
  };

  const updateVariantRow = (index, field, value) => {
    setFormData(prev => {
      const newVariants = [...prev.weight_variants];
      newVariants[index][field] = value;
      return { ...prev, weight_variants: newVariants };
    });
  };

  const removeVariantRow = (index) => {
    setFormData(prev => {
      const newVariants = [...prev.weight_variants];
      newVariants.splice(index, 1);
      return { ...prev, weight_variants: newVariants };
    });
  };

  const filtered = products.filter((p) =>
    !searchTerm ||
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasLowStock = products.some(p => p.stock < 10 || p.weight_variants?.some(v => v.stock < 10));

  return (
    <div className="admin-products">
      {hasLowStock && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
          ⚠️ Warning: Some products or variants are running low on stock (under 10 items).
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Products Management</h1>
          <p>Manage your product catalog, stock, and pricing.</p>
        </div>
        <div className="header-actions">
          {categories.length === 0 && (
            <button 
              className="add-btn" 
              onClick={handleInitializeCategories} 
              style={{ background: 'var(--text-main)', marginRight: '1rem' }}
              disabled={saving}
            >
              {saving ? 'Initializing...' : 'Initialize Categories'}
            </button>
          )}
          <button className="add-btn" onClick={openAddModal}>
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts({ search: searchTerm, limit: 100 })}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading products...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Info</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>No products found.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="prod-img">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={20} color="#ccc" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{p.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>{p.slug}</span>
                    </div>
                  </td>
                  <td>{p.category?.name || '-'}</td>
                  <td>PKR {Number(p.base_price).toLocaleString()}</td>
                  <td>
                    <button 
                      onClick={() => handleStockUpdate(p.id, p.stock)}
                      className={`stock-level ${p.stock < 10 ? 'low' : ''}`}
                      style={{ border: '1px dashed #ccc', background: 'transparent', cursor: 'pointer' }}
                      title="Click to edit stock"
                    >
                      {p.stock} units
                    </button>
                  </td>
                  <td>
                    <span 
                      className={`status-pill ${p.is_active ? 'active' : 'inactive'}`} 
                      onClick={() => handleToggleActive(p)} 
                      style={{ cursor: 'pointer' }}
                      title="Toggle Active"
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={p.is_featured} 
                      onChange={() => handleToggleFeatured(p)}
                      title="Toggle Featured"
                    />
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="edit-btn" onClick={() => openEditModal(p)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(p.id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-content"
              style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>
              
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Product Images</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {/* Existing Images (Edit mode) */}
                  {editingProduct?.images?.map((img, idx) => (
                    <div key={`existing-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
                      <img src={img} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(img)}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  
                  {/* Pending Images (Add mode or adding more to existing) */}
                  {selectedFiles.map((item, idx) => (
                    <div key={`pending-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary)', opacity: 0.8 }}>
                      <img src={item.previewUrl} alt="Pending" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button"
                        onClick={() => handleRemovePendingImage(idx)}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'var(--text-main)', color: 'white', border: 'none', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        &times;
                      </button>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '10px', textAlign: 'center' }}>Pending</div>
                    </div>
                  ))}
                </div>
                <div>
                  <input 
                    type="file" 
                    multiple
                    accept="image/jpeg, image/png, image/webp" 
                    style={{ display: 'none' }} 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    style={{ padding: '0.5rem 1rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ImageIcon size={16} />
                    {uploadingImage ? 'Uploading...' : 'Add Images'}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {editingProduct ? 'Images will be uploaded immediately.' : 'Images will be uploaded after you click Create Product.'}
                  </p>
                </div>
              </div>

              <form className="modal-form" onSubmit={handleSave}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Organic Dried Figs"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                      required
                    >
                      <option value="">Select category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Base Price (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData((p) => ({ ...p, base_price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Enter product description..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Base Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))}
                      placeholder="100"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(p => ({ ...p, is_featured: e.target.checked }))}
                      />
                      Is Featured (Shows on Homepage)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.is_active}
                        onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                      />
                      Is Active
                    </label>
                  </div>
                </div>

                {/* Weight Variants Section */}
                <div className="form-group" style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ margin: 0, fontSize: '1.1rem' }}>Weight Variants</label>
                    <button 
                      type="button" 
                      onClick={addVariantRow}
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      + Add Variant
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', color: '#6b7280' }}>
                    <span>Label (e.g. 250g)</span>
                    <span>Weight (grams)</span>
                    <span>Price (PKR)</span>
                    <span>Stock</span>
                    <span></span>
                  </div>
                  
                  {formData.weight_variants.map((v, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input type="text" required placeholder="250g" value={v.label} onChange={e => updateVariantRow(index, 'label', e.target.value)} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <input type="number" required min="1" placeholder="250" value={v.weight_grams} onChange={e => updateVariantRow(index, 'weight_grams', e.target.value)} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <input type="number" required min="0" step="0.01" placeholder="1200" value={v.price} onChange={e => updateVariantRow(index, 'price', e.target.value)} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <input type="number" required min="0" placeholder="50" value={v.stock} onChange={e => updateVariantRow(index, 'stock', e.target.value)} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <button type="button" onClick={() => removeVariantRow(index)} disabled={formData.weight_variants.length === 1} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{adminManagementStyles}</style>
    </div>
  );
};

export default AdminProducts;
