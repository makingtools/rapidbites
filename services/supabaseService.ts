import { supabase } from '../supabaseClient';
import { AppDataState, User, Warehouse } from '../types';

export const login = async (email: string, pass: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    console.error('Error logging in:', error);
    return null;
  }

  if (data.user) {
    // Fetch the user profile from the 'users' table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      await supabase.auth.signOut();
      return null;
    }

    return userProfile as User;
  }

  return null;
};

export const logout = async () => {
    await supabase.auth.signOut();
};

export const getInitialAppState = async (): Promise<AppDataState | null> => {
  const { data: customers, error: customersError } = await supabase.from('customers').select('*');
  if (customersError) console.error('Error fetching customers:', customersError);

  const { data: products, error: productsError } = await supabase.from('products').select('*');
  if (productsError) console.error('Error fetching products:', productsError);

  const { data: suppliers, error: suppliersError } = await supabase.from('suppliers').select('*');
  if (suppliersError) console.error('Error fetching suppliers:', suppliersError);

  const { data: salespeople, error: salespeopleError } = await supabase.from('salespeople').select('*');
  if (salespeopleError) console.error('Error fetching salespeople:', salespeopleError);

  const { data: invoices, error: invoicesError } = await supabase.from('invoices').select('*');
  if (invoicesError) console.error('Error fetching invoices:', invoicesError);
  
  const { data: quotes, error: quotesError } = await supabase.from('quotes').select('*');
  if (quotesError) console.error('Error fetching quotes:', quotesError);

  const { data: purchaseOrders, error: purchaseOrdersError } = await supabase.from('purchase_orders').select('*');
  if (purchaseOrdersError) console.error('Error fetching purchase_orders:', purchaseOrdersError);

  const { data: users, error: usersError } = await supabase.from('users').select('*');
  if (usersError) console.error('Error fetching users:', usersError);

  const { data: brands, error: brandsError } = await supabase.from('brands').select('*');
  if (brandsError) console.error('Error fetching brands:', brandsError);

  const { data: warehouses, error: warehousesError } = await supabase.from('warehouses').select('*');
  if (warehousesError) console.error('Error fetching warehouses:', warehousesError);
  
  const { data: warehouseTransfers, error: warehouseTransfersError } = await supabase.from('warehouse_transfers').select('*');
  if (warehouseTransfersError) console.error('Error fetching warehouse_transfers:', warehouseTransfersError);

  const { data: notifications, error: notificationsError } = await supabase.from('notifications').select('*');
  if (notificationsError) console.error('Error fetching notifications:', notificationsError);

  const { data: expenseCategories, error: expenseCategoriesError } = await supabase.from('expense_categories').select('*');
  if (expenseCategoriesError) console.error('Error fetching expense_categories:', expenseCategoriesError);

  const { data: expenses, error: expensesError } = await supabase.from('expenses').select('*');
  if (expensesError) console.error('Error fetching expenses:', expensesError);

  const { data: promotions, error: promotionsError } = await supabase.from('promotions').select('*');
  if (promotionsError) console.error('Error fetching promotions:', promotionsError);

  const { data: marketingCampaigns, error: marketingCampaignsError } = await supabase.from('marketing_campaigns').select('*');
  if (marketingCampaignsError) console.error('Error fetching marketing_campaigns:', marketingCampaignsError);

  const { data: cashSessions, error: cashSessionsError } = await supabase.from('cash_sessions').select('*');
  if (cashSessionsError) console.error('Error fetching cash_sessions:', cashSessionsError);

  const { data: cashClosings, error: cashClosingsError } = await supabase.from('cash_closings').select('*');
  if (cashClosingsError) console.error('Error fetching cash_closings:', cashClosingsError);

  const { data: auditLog, error: auditLogError } = await supabase.from('audit_log').select('*');
  if (auditLogError) console.error('Error fetching audit_log:', auditLogError);

  const { data: commission_types, error: commission_typesError } = await supabase.from('commission_types').select('*');
  if (commission_typesError) console.error('Error fetching commission_types:', commission_typesError);

  const { data: inventory_groups, error: inventory_groupsError } = await supabase.from('inventory_groups').select('*');
  if (inventory_groupsError) console.error('Error fetching inventory_groups:', inventory_groupsError);

  const { data: inventory_price_types, error: inventory_price_typesError } = await supabase.from('inventory_price_types').select('*');
  if (inventory_price_typesError) console.error('Error fetching inventory_price_types:', inventory_price_typesError);

  const { data: inventory_units, error: inventory_unitsError } = await supabase.from('inventory_units').select('*');
  if (inventory_unitsError) console.error('Error fetching inventory_units:', inventory_unitsError);

  const { data: config_document_types, error: config_document_typesError } = await supabase.from('config_document_types').select('*');
  if (config_document_typesError) console.error('Error fetching config_document_types:', config_document_typesError);

  const { data: config_payment_methods, error: config_payment_methodsError } = await supabase.from('config_payment_methods').select('*');
  if (config_payment_methodsError) console.error('Error fetching config_payment_methods:', config_payment_methodsError);

  const { data: config_branches, error: config_branchesError } = await supabase.from('config_branches').select('*');
  if (config_branchesError) console.error('Error fetching config_branches:', config_branchesError);

  const { data: config_user_profiles, error: config_user_profilesError } = await supabase.from('config_user_profiles').select('*');
  if (config_user_profilesError) console.error('Error fetching config_user_profiles:', config_user_profilesError);

  const { data: config_resolutions, error: config_resolutionsError } = await supabase.from('config_resolutions').select('*');
  if (config_resolutionsError) console.error('Error fetching config_resolutions:', config_resolutionsError);

  const { data: config_retention_types, error: config_retention_typesError } = await supabase.from('config_retention_types').select('*');
  if (config_retention_typesError) console.error('Error fetching config_retention_types:', config_retention_typesError);

  const { data: config_denominations, error: config_denominationsError } = await supabase.from('config_denominations').select('*');
  if (config_denominationsError) console.error('Error fetching config_denominations:', config_denominationsError);

  const { data: config_classification_accounts, error: config_classification_accountsError } = await supabase.from('config_classification_accounts').select('*');
  if (config_classification_accountsError) console.error('Error fetching config_classification_accounts:', config_classification_accountsError);

  const { data: systemSettings, error: systemSettingsError } = await supabase.from('system_settings').select('*').single();
  if (systemSettingsError) console.error('Error fetching system_settings:', systemSettingsError);

  const { data: supportTickets, error: supportTicketsError } = await supabase.from('support_tickets').select('*');
  if (supportTicketsError) console.error('Error fetching support_tickets:', supportTicketsError);

  return {
    customers: customers || [],
    products: products || [],
    suppliers: suppliers || [],
    salespeople: salespeople || [],
    invoices: invoices || [],
    quotes: quotes || [],
    purchaseOrders: purchaseOrders || [],
    users: users || [],
    brands: brands || [],
    warehouses: warehouses || [],
    warehouseTransfers: warehouseTransfers || [],
    notifications: notifications || [],
    expenseCategories: expenseCategories || [],
    expenses: expenses || [],
    promotions: promotions || [],
    marketingCampaigns: marketingCampaigns || [],
    cashSessions: cashSessions || [],
    cashClosings: cashClosings || [],
    auditLog: auditLog || [],
    commission_types: commission_types || [],
    inventory_groups: inventory_groups || [],
    inventory_price_types: inventory_price_types || [],
    inventory_units: inventory_units || [],
    config_document_types: config_document_types || [],
    config_payment_methods: config_payment_methods || [],
    config_branches: config_branches || [],
    config_user_profiles: config_user_profiles || [],
    config_resolutions: config_resolutions || [],
    config_retention_types: config_retention_types || [],
    config_denominations: config_denominations || [],
    config_classification_accounts: config_classification_accounts || [],
    systemSettings: systemSettings || {},
    supportTickets: supportTickets || [],
  } as AppDataState;
};

export const getWarehouses = async (): Promise<Warehouse[]> => {
    const { data, error } = await supabase.from('warehouses').select('*');
    if (error) {
        console.error('Error fetching warehouses:', error);
        return [];
    }
    return data as Warehouse[];
}



export const saveRecord = async (tableName: string, record: any) => {
    const { data, error } = await supabase.from(tableName).upsert(record).select();
    if (error) {
        console.error(`Error saving record to ${tableName}:`, error);
        return null;
    }
    return data?.[0];
}

export const deleteRecord = async (tableName: string, id: string | number) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
        console.error(`Error deleting record from ${tableName}:`, error);
    }
}