import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, Image as ImageIcon, X, FolderOpen, AlertTriangle } from 'lucide-react';
import { Button, Badge, Input, Modal, Select, Card } from '../components/ui';

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
    error: productsError,
    refresh: fetchProducts,
    refreshCategories,
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
        description: formData.description || null,
        category_id: formData.category_id || null,
        base_price: parseFloat(formData.base_price) || 0,
        stock: parseInt(formData.stock) || 0,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        weight_variants: formData.weight_variants.map(v => ({
          label: v.label,
          weight_grams: parseInt(v.weight_grams) || 0,
          price: parseFloat(v.price) || 0,
          stock: parseInt(v.stock) || 0
        }))
      };

      // Basic client-side validation
      if (!payload.name) throw new Error('Product name is required');
      if (!payload.category_id) throw new Error('Please select a category');
      if (payload.base_price <= 0) throw new Error('Base price must be greater than 0');
      if (payload.weight_variants.length === 0) throw new Error('At least one weight variant is required');
      
      for (const v of payload.weight_variants) {
        if (!v.label || v.weight_grams <= 0 || v.price <= 0) {
          throw new Error('All variants must have label, weight > 0, and price > 0');
        }
      }

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
      const errorMsg = err?.response?.data?.error?.message || err?.message || 'Failed to save product';
      toast.error(errorMsg, { id: 'img-upload' });
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
        <Card className="bg-amber-50 border-amber-200 mb-6 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={20} />
            <span className="font-semibold">Warning: Some products or variants are running low on stock (under 10 items).</span>
          </div>
        </Card>
      )}

      <div className="page-header">
        <div>
          <h1>Products Management</h1>
          <p>Manage your product catalog, stock, and pricing.</p>
        </div>
        <div className="header-actions flex gap-3">
          {categories.length === 0 && (
            <Button 
              variant="admin-danger" 
              icon={FolderOpen} 
              onClick={() => window.location.href = '/admin/categories'}
            >
              Create Categories First
            </Button>
          )}
          <Button 
            variant="admin-primary" 
            icon={Plus} 
            onClick={openAddModal} 
            disabled={categories.length === 0}
          >
            Add New Product
          </Button>
        </div>
      </div>

      <div className="admin-toolbar">
        <Input
          placeholder="Search by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchProducts({ search: searchTerm, limit: 100 })}
          icon={Search}
          containerClassName="mb-0 flex-1"
        />
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
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <strong>{p.name}</strong>
                      <span className="text-xs text-gray-500">{p.slug}</span>
                    </div>
                  </td>
                  <td>{p.category?.name || '-'}</td>
                  <td>PKR {Number(p.base_price).toLocaleString()}</td>
                  <td>
                    <button 
                      onClick={() => handleStockUpdate(p.id, p.stock)}
                      className={`text-sm font-bold px-2 py-1 rounded border border-dashed ${p.stock < 10 ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-300 text-slate-600'} hover:border-primary transition-colors cursor-pointer`}
                      title="Click to edit stock"
                    >
                      {p.stock} units
                    </button>
                  </td>
                  <td>
                    <Badge 
                      variant={p.is_active ? 'success' : 'error'} 
                      onClick={() => handleToggleActive(p)} 
                      className="cursor-pointer"
                      title="Toggle Active"
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
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
                    <div className="flex gap-2">
                      <Button
                        variant="admin-ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => openEditModal(p)}
                        title="Edit"
                      />
                      <Button
                        variant="admin-danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(p.id)}
                        title="Delete"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="2xl"
        footer={
          <div className="flex gap-4 justify-end w-full">
            <Button variant="admin-outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button 
              variant="admin-primary" 
              onClick={handleSave} 
              loading={saving}
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* Images Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Product Images</h3>
            <div className="admin-img-preview-grid">
              {editingProduct?.images?.map((img, idx) => (
                <div key={`existing-${idx}`} className="admin-img-thumb">
                  <img src={img} alt="Product" />
                  <button type="button" onClick={() => handleRemoveImage(img)} className="admin-img-remove"><X size={12} /></button>
                </div>
              ))}
              {selectedFiles.map((item, idx) => (
                <div key={`pending-${idx}`} className="admin-img-thumb pending">
                  <img src={item.previewUrl} alt="Pending" />
                  <button type="button" onClick={() => handleRemovePendingImage(idx)} className="admin-img-remove"><X size={12} /></button>
                  <div className="admin-img-pending-badge">Pending</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <Button 
                variant="admin-ghost" 
                icon={ImageIcon} 
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Add Images'}
              </Button>
              <p className="text-[11px] text-slate-500 mt-2">
                {editingProduct ? 'Changes apply instantly.' : 'Uploads after creation.'}
              </p>
            </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Organic Dried Figs"
              required
              containerClassName="md:col-span-2"
            />
            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
              disabled={categories.length === 0}
              options={[
                { value: '', label: 'No Category' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
            />
            <Input
              label="Base Price (PKR)"
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData((p) => ({ ...p, base_price: e.target.value }))}
              placeholder="0.00"
              required
            />
            <Input
              label="Description"
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              containerClassName="md:col-span-2"
            />
            <Input
              label="Base Stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))}
              placeholder="100"
            />
            <div className="flex gap-6 items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 rounded text-primary" />
                Featured
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded text-primary" />
                Active
              </label>
            </div>
          </div>

          {/* Weight Variants */}
          <Card className="border-slate-200 bg-slate-50/50" title={
            <div className="flex justify-between items-center w-full">
              <span>Weight Variants</span>
              <Button variant="admin-primary" size="sm" onClick={addVariantRow} type="button">+ Add</Button>
            </div>
          }>
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-5 gap-4 text-xs font-bold text-slate-400 px-1">
                <span>Label</span>
                <span>Weight (g)</span>
                <span>Price (PKR)</span>
                <span>Stock</span>
                <span></span>
              </div>
              {formData.weight_variants.map((v, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  <Input value={v.label} onChange={e => updateVariantRow(index, 'label', e.target.value)} placeholder="250g" containerClassName="mb-0" />
                  <Input type="number" value={v.weight_grams} onChange={e => updateVariantRow(index, 'weight_grams', e.target.value)} placeholder="250" containerClassName="mb-0" />
                  <Input type="number" value={v.price} onChange={e => updateVariantRow(index, 'price', e.target.value)} placeholder="1200" containerClassName="mb-0" />
                  <Input type="number" value={v.stock} onChange={e => updateVariantRow(index, 'stock', e.target.value)} placeholder="50" containerClassName="mb-0" />
                  <Button 
                    variant="admin-ghost" 
                    size="sm" 
                    icon={Trash2} 
                    onClick={() => removeVariantRow(index)} 
                    disabled={formData.weight_variants.length === 1}
                    className="text-red-500"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Modal>

      
    </div>
  );
};

export default AdminProducts;
