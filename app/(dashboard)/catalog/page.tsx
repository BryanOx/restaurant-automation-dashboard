'use client';

// ============================================
// Catalog Page - Products & Categories management
// ============================================

import { useState } from 'react';
import { Card, CardHeader, Badge, PageLoading, ErrorState } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useCategories, useProducts, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/lib/hooks';
import { useAuth } from '@/lib/auth/AuthContext';
import { CategoryDTO, ProductDTO } from '@/lib/types';

function CategoryRow({ category, onEdit, onDelete }: { category: CategoryDTO; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
      <div>
        <p className="font-medium text-gray-900">{category.name}</p>
        <p className="text-xs text-gray-400">Creado: {new Date(category.createdAt).toLocaleDateString('es-UY')}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
        <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
      </div>
    </div>
  );
}

function ProductRow({ product, onEdit, onDelete }: { product: ProductDTO; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{product.name}</p>
          <Badge variant={product.isActive ? 'success' : 'default'}>
            {product.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        {product.description && <p className="text-sm text-gray-500 mt-1">{product.description}</p>}
        <p className="text-sm text-gray-700 mt-1">${product.price.toLocaleString('es-UY')}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
        <button onClick={onDelete} className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [categoryName, setCategoryName] = useState('');
  
  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: 0, categoryId: '', isActive: true });

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories(!authLoading && isAuthenticated);
  const { data: productsData, isLoading: productsLoading } = useProducts(!authLoading && isAuthenticated);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];

  // Handlers
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data: { name: categoryName } });
    } else {
      await createCategory.mutateAsync({ name: categoryName });
    }
    setCategoryName('');
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('¿Eliminar categoría?')) {
      await deleteCategory.mutateAsync(id);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || productForm.price <= 0) return;
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, data: productForm });
    } else {
      await createProduct.mutateAsync(productForm);
    }
    setProductForm({ name: '', description: '', price: 0, categoryId: '', isActive: true });
    setEditingProduct(null);
    setShowProductModal(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('¿Eliminar producto?')) {
      await deleteProduct.mutateAsync(id);
    }
  };

  if (authLoading) return <PageLoading />;
  if (!isAuthenticated) return <div className="p-4">Redirigiendo al login...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="text-sm text-gray-500">Gestión de productos y categorías</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Productos ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Categorías ({categories.length})
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader 
            title="Productos" 
            action={
              <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: 0, categoryId: '', isActive: true }); setShowProductModal(true); }} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">
                + Nuevo Producto
              </button>
            }
          />
          {productsLoading ? (
            <PageLoading text="Cargando productos..." />
          ) : products.length === 0 ? (
            <EmptyState title="Sin productos" message="Crea tu primer producto" />
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map(p => <ProductRow key={p.id} product={p} onEdit={() => { setEditingProduct(p); setProductForm({ name: p.name, description: p.description || '', price: p.price, categoryId: p.categoryId || '', isActive: p.isActive }); setShowProductModal(true); }} onDelete={() => handleDeleteProduct(p.id)} />)}
            </div>
          )}
        </Card>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader 
            title="Categorías" 
            action={
              <button onClick={() => { setEditingCategory(null); setCategoryName(''); setShowCategoryModal(true); }} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">
                + Nueva Categoría
              </button>
            }
          />
          {categoriesLoading ? (
            <PageLoading text="Cargando categorías..." />
          ) : categories.length === 0 ? (
            <EmptyState title="Sin categorías" message="Crea tu primera categoría" />
          ) : (
            <div className="divide-y divide-gray-100">
              {categories.map(c => <CategoryRow key={c.id} category={c} onEdit={() => { setEditingCategory(c); setCategoryName(c.name); setShowCategoryModal(true); }} onDelete={() => handleDeleteCategory(c.id)} />)}
            </div>
          )}
        </Card>
      )}

      {/* Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}>
        <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Nombre de categoría" className="w-full border border-gray-300 rounded-md p-2 mb-4" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
          <button onClick={handleSaveCategory} className="px-4 py-2 bg-blue-600 text-white rounded-md">Guardar</button>
        </div>
      </Modal>

      {/* Product Modal */}
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}>
        <div className="space-y-3 mb-4">
          <input type="text" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre" className="w-full border border-gray-300 rounded-md p-2" />
          <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción" className="w-full border border-gray-300 rounded-md p-2" />
          <input type="number" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} placeholder="Precio" className="w-full border border-gray-300 rounded-md p-2" />
          <select value={productForm.categoryId} onChange={e => setProductForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full border border-gray-300 rounded-md p-2">
            <option value="">Sin categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={productForm.isActive} onChange={e => setProductForm(f => ({ ...f, isActive: e.target.checked }))} />
            <span>Activo</span>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowProductModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
          <button onClick={handleSaveProduct} className="px-4 py-2 bg-blue-600 text-white rounded-md">Guardar</button>
        </div>
      </Modal>
    </div>
  );
}