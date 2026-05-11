export interface Tag {
  id: string;
  name: string;
  color: string;
  category_id: string;
}

export interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

export interface Transaction {
  id: string;
  external_id: string | null;
  date: string;
  amount: number;
  currency: string;
  description: string;
  source: 'bank' | 'manual';
  transaction_tags: {
    tag_id: string;
    tags: Tag;
  }[];
}
