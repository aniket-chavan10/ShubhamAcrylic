import { useState } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "./ui";
import { inr } from "../utils/format";
import { getImageUrl } from "../utils/imageUtils";

const ProductTable = ({
  products,
  onEdit,
  onDelete,
  onAdd,
}: {
  products: any[] | undefined;
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
  onAdd?: () => void;
}) => {
  const safeProducts = Array.isArray(products) ? products : [];

  const categories = ["All", ...Array.from(new Set(safeProducts.map((p) =>
    typeof p.category === "object" ? p.category?.name : p.category
  )))];
  const [activeTab, setActiveTab] = useState<string>("All");

  const filteredProducts =
    activeTab === "All"
      ? safeProducts
      : safeProducts.filter((p) => {
          const catName = typeof p.category === "object" ? p.category?.name : p.category;
          return catName === activeTab;
        });

  const normalizeTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) {
      return tags.flatMap((tag) => {
        try {
          const parsed = JSON.parse(tag);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [tag];
        }
      });
    }
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return tags.split(",").map((t) => t.trim());
      }
    }
    return [];
  };

  const catName = (p: any) => (typeof p.category === "object" ? p.category?.name : p.category);
  const mainImage = (p: any) => p.imageUrl || p.images?.find((i: any) => i.isMain)?.imageUrl || p.images?.[0]?.imageUrl;

  const Thumb = ({ product, size = "h-14 w-14" }: { product: any; size?: string }) => (
    <div className="relative shrink-0">
      {mainImage(product)
        ? <img src={getImageUrl(mainImage(product))} alt={product.name} className={`${size} rounded-xl border border-line bg-paper object-cover`} />
        : <div className={`${size} grid place-items-center rounded-xl bg-paper text-muted`}><Package className="h-5 w-5" /></div>}
      {product.images?.length > 1 && (
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[9px] font-bold text-white">{product.images.length}</span>
      )}
    </div>
  );

  const Stock = ({ qty }: { qty: number }) => (
    <span className={`a-badge ${qty < 5 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{qty} in stock</span>
  );

  const Actions = ({ product }: { product: any }) => (
    <div className="flex justify-end gap-1">
      <button className="a-icon-btn" onClick={() => onEdit(product)} title="Edit"><Pencil className="h-4 w-4" /></button>
      <button className="a-icon-btn-danger" onClick={() => onDelete(product.id)} title="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  if (safeProducts.length === 0) {
    return (
      <div className="a-card">
        <EmptyState icon={Package} title="No products yet" text="Add your first product to show it in the shop.">
          {onAdd && <button onClick={onAdd} className="a-btn-primary"><Plus className="h-4 w-4" /> Add product</button>}
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      {/* Category filter */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {categories.map((category) => (
          <button key={category} onClick={() => setActiveTab(category)} className={`shrink-0 ${activeTab === category ? "a-chip-active" : "a-chip"}`}>
            {category || "Uncategorised"}
          </button>
        ))}
      </div>

      <div className="a-card overflow-hidden">
        {filteredProducts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">No products in this category.</p>
        ) : (
          <>
            {/* Phones: stacked cards */}
            <ul className="divide-y divide-line md:hidden">
              {filteredProducts.map((product) => (
                <li key={product.id} className="flex gap-3 p-4">
                  <Thumb product={product} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-muted">{[product.productCode, catName(product)].filter(Boolean).join(" · ")}</p>
                      </div>
                      <p className="shrink-0 font-semibold">{inr(product.price)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Stock qty={product.stockQuantity} />
                      <div className="-mr-2"><Actions product={product} /></div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Tablets & desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-line bg-paper/60">
                  <tr>
                    <th className="a-th">Product</th>
                    <th className="a-th">Code</th>
                    <th className="a-th">Category</th>
                    <th className="a-th text-right">Price</th>
                    <th className="a-th">Stock</th>
                    <th className="a-th">Tags</th>
                    <th className="a-th" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition hover:bg-paper/60">
                      <td className="a-td">
                        <div className="flex items-center gap-3">
                          <Thumb product={product} size="h-12 w-12" />
                          <div className="min-w-0">
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-muted">{[product.materialType, product.size].filter(Boolean).join(", ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="a-td">{product.productCode && <span className="a-badge bg-paper font-mono text-muted">{product.productCode}</span>}</td>
                      <td className="a-td">{catName(product) || "—"}</td>
                      <td className="a-td text-right font-semibold">{inr(product.price)}</td>
                      <td className="a-td"><Stock qty={product.stockQuantity} /></td>
                      <td className="a-td">
                        <div className="flex flex-wrap gap-1">
                          {normalizeTags(product.tags).slice(0, 3).map((tag: string) => (
                            <span key={tag} className="a-badge bg-accent-soft font-medium text-accent-dark">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="a-td"><Actions product={product} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductTable;
