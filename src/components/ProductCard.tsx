import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/storage';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

type CategoryKey = 'kukus' | 'goreng' | 'bakar' | 'lainnya';

const categoryColors: Record<CategoryKey, string> = {
  kukus: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  goreng: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  bakar: 'bg-gradient-to-r from-red-500 to-pink-500',
  lainnya: 'bg-gradient-to-r from-gray-500 to-gray-600',
};

const categoryBgColors: Record<CategoryKey, string> = {
  kukus: 'from-blue-50 to-cyan-50',
  goreng: 'from-yellow-50 to-orange-50',
  bakar: 'from-red-50 to-pink-50',
  lainnya: 'from-gray-50 to-gray-100',
};

const categoryIcons: Record<CategoryKey, string> = {
  kukus: '🥟',
  goreng: '🍤',
  bakar: '🔥',
  lainnya: '🍽️',
};

const categoryLabels: Record<CategoryKey, string> = {
  kukus: 'Kukus',
  goreng: 'Goreng',
  bakar: 'Bakar',
  lainnya: 'Lainnya',
};

// Helper function to get valid category key
const getCategoryKey = (category: string | undefined): CategoryKey => {
  const validCategories: CategoryKey[] = ['kukus', 'goreng', 'bakar', 'lainnya'];
  if (category && validCategories.includes(category as CategoryKey)) {
    return category as CategoryKey;
  }
  return 'lainnya';
};

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const categoryKey = getCategoryKey(product.category);
  
  return (
    <Card className="group relative overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryBgColors[categoryKey]} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
      
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
      
      <CardContent className="relative p-5">
        {/* Product image placeholder with gradient */}
        <div className={`w-full h-32 mb-4 rounded-xl bg-gradient-to-br ${categoryBgColors[categoryKey]} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300`}>
          <span className="text-6xl filter drop-shadow-lg">{categoryIcons[categoryKey]}</span>
        </div>

        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-700 transition-colors duration-300">
              {product.name}
            </h3>
          </div>
          <Badge className={`${categoryColors[categoryKey]} text-white border-0 shadow-md px-3 py-1 text-xs font-semibold`}>
            {categoryLabels[categoryKey]}
          </Badge>
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex justify-between items-center pt-3 border-t-2 border-purple-100">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Harga</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatCurrency(product.price)}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => onAdd(product)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-5 h-11 group-hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-1" />
            Tambah
          </Button>
        </div>

        {/* Sparkle effect on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}