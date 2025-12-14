import { OrderItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/storage';

interface OrderSummaryProps {
  items: OrderItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function OrderSummary({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: OrderSummaryProps) {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <Card className="sticky top-4 border-2 border-purple-200 shadow-2xl overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-1">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ringkasan Pesanan
            </span>
            {items.length > 0 && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 ml-auto">
                {items.length} item
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </div>

      <CardContent className="pt-6">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
              <ShoppingCart className="h-12 w-12 text-purple-400" />
            </div>
            <p className="text-gray-500 font-medium">Belum ada pesanan</p>
            <p className="text-sm text-gray-400 mt-2">Tambahkan produk untuk memulai</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, index) => (
                <div
                  key={item.product.id}
                  className="group relative p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'slideIn 0.3s ease-out forwards'
                  }}
                >
                  {/* Sparkle effect */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">
                        {item.product.name}
                      </p>
                      <p className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-200">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-2 border-purple-300 hover:bg-purple-100 hover:border-purple-400 transition-all duration-300"
                        onClick={() =>
                          onUpdateQuantity(
                            item.product.id,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                      >
                        <Minus className="h-3 w-3 text-purple-600" />
                      </Button>
                      <Badge 
                        variant="secondary" 
                        className="min-w-[2.5rem] justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 font-bold text-sm px-3 py-1"
                      >
                        {item.quantity}
                      </Badge>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-2 border-purple-300 hover:bg-purple-100 hover:border-purple-400 transition-all duration-300"
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3 text-purple-600" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0 shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => onRemoveItem(item.product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 h-0.5" />

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-gray-800">Total</span>
                  <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-14 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              onClick={onCheckout}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Proses Pembayaran
            </Button>
          </>
        )}
      </CardContent>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #f3e8ff, #fce7f3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9333ea, #ec4899);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7e22ce, #db2777);
        }
      `}</style>
    </Card>
  );
}