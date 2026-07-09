export type CustomerType   = 'Retail' | 'Wholesale'
export type DocumentType   = 'DNI' | 'RUC' | 'CE' | 'Pasaporte'

export interface CustomerAddress {
  id: string
  label: string
  street: string
  city: string
  state?: string
  postalCode?: string
  country: string
  isDefault: boolean
}

export interface Customer {
  id: string
  userId?: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  phoneNumber?: string
  documentNumber: string
  documentType: DocumentType
  street?: string
  city?: string
  province?: string
  postalCode?: string
  customerType: CustomerType
  isActive: boolean
  notes?: string
  addresses: CustomerAddress[]
  totalOrders: number
  totalSpent: number
  currency: string
  lastOrderAt?: string
  createdAt: string
  updatedAt: string
}

export interface CustomerListItem {
  id: string
  fullName: string
  email?: string
  phoneNumber?: string
  documentNumber: string
  documentType: DocumentType
  city?: string
  customerType: CustomerType
  isActive: boolean
  totalOrders: number
  totalSpent: number
  currency: string
  lastOrderAt?: string
  createdAt: string
}

export interface CreateCustomerRequest {
  firstName: string
  lastName: string
  documentNumber: string
  documentType: DocumentType
  email?: string
  phoneNumber?: string
  street?: string
  city?: string
  province?: string
  postalCode?: string
  customerType: CustomerType
  notes?: string
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: string
}

export interface GetCustomersParams {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}
