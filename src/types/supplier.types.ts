export interface SupplierContact {
  id: string
  name: string
  jobTitle?: string
  email?: string
  phone?: string
  isPrimary: boolean
}

export interface Supplier {
  id: string
  companyName: string
  tradeName?: string
  taxId?: string
  email?: string
  phone?: string
  website?: string
  city?: string
  province?: string
  country?: string
  paymentTerms?: string
  isActive: boolean
  notes?: string
  contacts: SupplierContact[]
  createdAt: string
  updatedAt: string
}

export interface SupplierListItem {
  id: string
  companyName: string
  tradeName?: string
  taxId?: string
  email?: string
  phone?: string
  city?: string
  isActive: boolean
  productCount: number
  createdAt: string
}

export interface CreateSupplierRequest {
  companyName: string
  tradeName?: string
  taxId?: string
  email?: string
  phone?: string
  website?: string
  city?: string
  province?: string
  country?: string
  paymentTerms?: string
  notes?: string
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
  id: string
}

export interface GetSuppliersParams {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}
