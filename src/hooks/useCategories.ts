import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (
    name: string,
    description?: string
  ): Promise<Category | null> => {
    const { data, error: insertError } = await supabase
      .from('categories')
      .insert({ name, description })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }

    await fetchCategories();
    return data;
  };

  const updateCategory = async (
    id: string,
    updates: { name?: string; description?: string }
  ): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      return false;
    }

    await fetchCategories();
    return true;
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }

    await fetchCategories();
    return true;
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
