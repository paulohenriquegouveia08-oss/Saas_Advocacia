'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/auth';

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export default function ClientDocuments({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const supabase = getSupabase();

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      setError('Erro ao carregar documentos: ' + err.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${Date.now()}.${fileExt}`;

    setIsUploading(true);
    setError('');

    try {
      // 1. Upload to Storage
      const { error: uploadError, data } = await supabase.storage
        .from('client_documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client_documents')
        .getPublicUrl(fileName);

      // 3. Save to database
      const { error: dbError } = await supabase
        .from('client_documents')
        .insert([
          {
            client_id: clientId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type || 'unknown'
          }
        ]);

      if (dbError) throw dbError;

      await fetchDocuments();
      event.target.value = ''; // reset input
    } catch (err: any) {
      setError('Erro ao enviar arquivo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Excluir o arquivo ${doc.file_name}?`)) return;

    try {
      // Extract file path from URL or use stored reference if we had one
      const urlParts = doc.file_url.split('/client_documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('client_documents').remove([filePath]);
      }

      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
      setDocuments(documents.filter(d => d.id !== doc.id));
    } catch (err: any) {
      setError('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm mt-6">
      <h3 className="text-lg font-bold mb-4">Documentos do Cliente</h3>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-4">
        <label className="block mb-2 font-medium">Anexar Novo Arquivo (PDF ou Imagem)</label>
        <input 
          type="file" 
          accept="image/*,application/pdf"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="border p-2 rounded w-full"
        />
        {isUploading && <p className="text-sm text-gray-500 mt-2">Enviando...</p>}
      </div>

      <table className="w-full text-left mt-4 border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Arquivo</th>
            <th className="py-2">Data</th>
            <th className="py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-center text-gray-500">Nenhum documento anexado.</td>
            </tr>
          ) : (
            documents.map(doc => (
              <tr key={doc.id} className="border-b">
                <td className="py-2">
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {doc.file_name}
                  </a>
                </td>
                <td className="py-2">
                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-2">
                  <button 
                    onClick={() => handleDelete(doc)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
