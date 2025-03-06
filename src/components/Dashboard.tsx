import React, { useState, useEffect } from 'react';
import { FolderPlus, FileUp, Link2, LogOut, Trash2, ChevronRight, ChevronDown, Folder, Plus, Copy, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, checkConnection } from '../lib/supabase';
import type { Group, Subgroup, File } from '../types/database';

interface DashboardProps {
  onLogout: () => void;
}

interface GroupWithDetails extends Group {
  subgroups: SubgroupWithDetails[];
  isExpanded: boolean;
}

interface SubgroupWithDetails extends Subgroup {
  files: File[];
  isExpanded: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLink, setNewFileLink] = useState('');
  const [addingSubgroupTo, setAddingSubgroupTo] = useState<string | null>(null);
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Handle session and visibility changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      supabase.auth.signOut();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        supabase.auth.signOut();
      }
    };

    const handleAuthStateChange = async (_event: string, session: any) => {
      if (!session) {
        onLogout();
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onLogout]);

  // Initialize app and check session
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          onLogout();
          return;
        }

        const connected = await checkConnection();
        setIsConnected(connected);
        
        if (!connected) {
          setError('Erro de conexão com o banco de dados. Por favor, recarregue a página.');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          onLogout();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Erro ao inicializar a aplicação');
        onLogout();
      }
    };

    initializeApp();
  }, [onLogout]);

  useEffect(() => {
    if (userId && isConnected) {
      fetchGroups();
    }
  }, [userId, isConnected]);

  useEffect(() => {
    if (copiedLink) {
      const timer = setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedLink]);

  const fetchGroups = async () => {
    if (!isConnected) return;

    try {
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: true });

      if (groupsError) throw groupsError;

      const { data: subgroups, error: subgroupsError } = await supabase
        .from('subgroups')
        .select('*')
        .order('created_at', { ascending: true });

      if (subgroupsError) throw subgroupsError;

      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: true });

      if (filesError) throw filesError;

      const groupsWithDetails: GroupWithDetails[] = (groups || []).map(group => ({
        ...group,
        isExpanded: true,
        subgroups: (subgroups || [])
          .filter(subgroup => subgroup.group_id === group.id)
          .map(subgroup => ({
            ...subgroup,
            isExpanded: true,
            files: (files || []).filter(file => file.subgroup_id === subgroup.id)
          }))
      }));

      setGroups(groupsWithDetails);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar os dados');
      const connected = await checkConnection();
      setIsConnected(connected);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !userId || !isConnected) return;

    const createPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from('groups')
          .insert([{ 
            name: newGroupName,
            user_id: userId
          }])
          .select()
          .single();

        if (error) throw error;

        setGroups([...groups, { ...data, subgroups: [], isExpanded: true }]);
        setNewGroupName('');
        setError(null);
        resolve(`Grupo "${newGroupName}" criado com sucesso!`);
      } catch (error) {
        console.error('Error creating group:', error);
        setError('Erro ao criar grupo');
        const connected = await checkConnection();
        setIsConnected(connected);
        reject(new Error('Erro ao criar grupo'));
      }
    });

    toast.promise(createPromise, {
      loading: 'Criando grupo...',
      success: (message: string) => message,
      error: 'Erro ao criar grupo'
    });
  };

  const handleCreateSubgroup = async (groupId: string) => {
    if (!newSubgroupName.trim() || !userId || !isConnected) return;

    const createPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from('subgroups')
          .insert([{ 
            name: newSubgroupName, 
            group_id: groupId,
            user_id: userId
          }])
          .select()
          .single();

        if (error) throw error;

        setGroups(groups.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              subgroups: [...group.subgroups, { ...data, files: [], isExpanded: true }]
            };
          }
          return group;
        }));

        setNewSubgroupName('');
        setAddingSubgroupTo(null);
        setError(null);
        resolve(`Subgrupo "${newSubgroupName}" criado com sucesso!`);
      } catch (error) {
        console.error('Error creating subgroup:', error);
        setError('Erro ao criar subgrupo');
        const connected = await checkConnection();
        setIsConnected(connected);
        reject(new Error('Erro ao criar subgrupo'));
      }
    });

    toast.promise(createPromise, {
      loading: 'Criando subgrupo...',
      success: (message: string) => message,
      error: 'Erro ao criar subgrupo'
    });
  };

  const handleAddFile = async () => {
    if (!selectedSubgroup || !newFileName || !newFileLink || !userId || !isConnected) return;

    const createPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase
          .from('files')
          .insert([{
            name: newFileName,
            link: newFileLink,
            subgroup_id: selectedSubgroup,
            user_id: userId
          }])
          .select()
          .single();

        if (error) throw error;

        setGroups(groups.map(group => ({
          ...group,
          subgroups: group.subgroups.map(subgroup => {
            if (subgroup.id === selectedSubgroup) {
              return {
                ...subgroup,
                files: [...subgroup.files, data]
              };
            }
            return subgroup;
          })
        })));

        setNewFileName('');
        setNewFileLink('');
        setError(null);
        resolve(`Arquivo "${newFileName}" adicionado com sucesso!`);
      } catch (error) {
        console.error('Error adding file:', error);
        setError('Erro ao adicionar arquivo');
        const connected = await checkConnection();
        setIsConnected(connected);
        reject(new Error('Erro ao adicionar arquivo'));
      }
    });

    toast.promise(createPromise, {
      loading: 'Adicionando arquivo...',
      success: (message: string) => message,
      error: 'Erro ao adicionar arquivo'
    });
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!isConnected) return;

    const groupName = groups.find(g => g.id === groupId)?.name;
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const { error } = await supabase
          .from('groups')
          .delete()
          .eq('id', groupId);

        if (error) throw error;

        setGroups(groups.filter(group => group.id !== groupId));
        if (selectedGroup === groupId) {
          setSelectedGroup(null);
          setSelectedSubgroup(null);
        }
        setError(null);
        resolve(`Grupo "${groupName}" excluído com sucesso!`);
      } catch (error) {
        console.error('Error deleting group:', error);
        setError('Erro ao deletar grupo');
        const connected = await checkConnection();
        setIsConnected(connected);
        reject(new Error('Erro ao excluir grupo'));
      }
    });

    toast.promise(deletePromise, {
      loading: 'Excluindo grupo...',
      success: (message: string) => message,
      error: 'Erro ao excluir grupo'
    });
  };

  const handleDeleteSubgroup = async (subgroupId: string) => {
    if (!isConnected) return;

    const subgroupName = groups
      .flatMap(g => g.subgroups)
      .find(s => s.id === subgroupId)?.name;

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const { error } = await supabase
          .from('subgroups')
          .delete()
          .eq('id', subgroupId);

        if (error) throw error;

        setGroups(groups.map(group => ({
          ...group,
          subgroups: group.subgroups.filter(subgroup => subgroup.id !== subgroupId)
        })));

        if (selectedSubgroup === subgroupId) {
          setSelectedSubgroup(null);
        }
        setError(null);
        resolve(`Subgrupo "${subgroupName}" excluído com sucesso!`);
      } catch (error) {
        console.error('Error deleting subgroup:', error);
        setError('Erro ao deletar subgrupo');
        const connected = await checkConnection();
        setIsConnected(connected);
        reject(new Error('Erro ao excluir subgrupo'));
      }
    });

    toast.promise(deletePromise, {
      loading: 'Excluindo subgrupo...',
      success: (message: string) => message,
      error: 'Erro ao excluir subgrupo'
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!isConnected) return;

    const fileName = groups
      .flatMap(g => g.subgroups)
      .flatMap(s => s.files)
      .find(f => f.id === fileId)?.name;

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const { error } = await supabase
          .from('files')
          .delete()
          .eq('id', fileId);

        if (error) throw error;

        setGroups(groups.map(group => ({
          ...group,
          subgroups: group.subgroups.map(subgroup => ({
            ...subgroup,
            files: subgroup.files.filter(file => file.id !== fileId)
          }))
        })));
        setError(null);
        resolve(`Arquivo "${fileName}" excluído com sucesso!`);
      } catch (error) {
        console.error('Error deleting file:', error);
        setError('Erro ao deletar arquivo');
        const connected = await checkConnection();
        setIsConnected(connected);
        reject(new Error('Erro ao excluir arquivo'));
      }
    });

    toast.promise(deletePromise, {
      loading: 'Excluindo arquivo...',
      success: (message: string) => message,
      error: 'Erro ao excluir arquivo'
    });
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Error copying link:', error);
      setError('Erro ao copiar link');
      toast.error('Erro ao copiar link');
    }
  };

  const toggleGroup = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, isExpanded: !group.isExpanded }
        : group
    ));
  };

  const toggleSubgroup = (groupId: string, subgroupId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          subgroups: group.subgroups.map(subgroup =>
            subgroup.id === subgroupId
              ? { ...subgroup, isExpanded: !subgroup.isExpanded }
              : subgroup
          )
        };
      }
      return group;
    }));
  };

  const renderSubgroup = (groupId: string, subgroup: SubgroupWithDetails, level: number) => (
    <div key={subgroup.id} className="rounded-md">
      <div
        className={`flex items-center p-2 cursor-pointer hover:bg-gray-700 ${
          selectedSubgroup === subgroup.id ? 'bg-gray-700' : ''
        }`}
        style={{ paddingLeft: `${level * 1}rem` }}
        onClick={() => setSelectedSubgroup(subgroup.id)}
      >
        <div className="flex items-center flex-1">
          {subgroup.files.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSubgroup(groupId, subgroup.id);
              }}
              className="p-1 hover:bg-gray-600 rounded"
            >
              {subgroup.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <Folder className="w-4 h-4 mr-2 text-blue-500" />
          <span>{subgroup.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteSubgroup(subgroup.id);
          }}
          className="p-1 text-red-500 hover:text-red-400 hover:bg-gray-600 rounded"
          disabled={!isConnected}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {subgroup.isExpanded && subgroup.files.length > 0 && (
        <div className="ml-2">
          {subgroup.files.map(file => (
            <div
              key={file.id}
              className="flex items-center p-2 hover:bg-gray-700 text-gray-400"
              style={{ paddingLeft: `${(level + 1) * 1}rem` }}
            >
              <Link2 className="w-4 h-4 mr-2 text-gray-400" />
              <span className="flex-1">{file.name}</span>
              <div className="flex items-center space-x-2">
                <a
                  href={file.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400"
                >
                  Baixar
                </a>
                <button
                  onClick={() => handleCopyLink(file.link)}
                  className={`p-1 hover:bg-gray-600 rounded ${
                    copiedLink === file.link ? 'text-green-500' : 'text-blue-500 hover:text-blue-400'
                  }`}
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id);
                  }}
                  className="p-1 text-red-500 hover:text-red-400 hover:bg-gray-600 rounded"
                  disabled={!isConnected}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGroup = (group: GroupWithDetails, level: number = 0) => (
    <div key={group.id} className="rounded-md">
      <div
        className={`flex items-center p-2 cursor-pointer hover:bg-gray-700 ${
          selectedGroup === group.id ? 'bg-gray-700' : ''
        }`}
        style={{ paddingLeft: `${level * 1}rem` }}
        onClick={() => setSelectedGroup(group.id)}
      >
        <div className="flex items-center flex-1">
          {group.subgroups.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGroup(group.id);
              }}
              className="p-1 hover:bg-gray-600 rounded"
            >
              {group.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <Folder className="w-4 h-4 mr-2 text-blue-500" />
          <span>{group.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGroup(group.id);
              setAddingSubgroupTo(group.id);
            }}
            className="p-1 text-blue-500 hover:text-blue-400 hover:bg-gray-600 rounded"
            disabled={!isConnected}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteGroup(group.id);
            }}
            className="p-1 text-red-500 hover:text-red-400 hover:bg-gray-600 rounded"
            disabled={!isConnected}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {group.isExpanded && (
        <div className="ml-2">
          {addingSubgroupTo === group.id && (
            <div className="flex items-center space-x-2 p-2" style={{ paddingLeft: `${(level + 1) * 1}rem` }}>
              <input
                type="text"
                value={newSubgroupName}
                onChange={(e) => setNewSubgroupName(e.target.value)}
                placeholder="Nome do subgrupo"
                className="flex-1 px-3 py-1 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!isConnected}
              />
              <button
                onClick={() => handleCreateSubgroup(group.id)}
                className="px-3 py-1 bg-blue-600 rounded-md hover:bg-blue-700 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isConnected}
              >
                Adicionar
              </button>
            </div>
          )}

          {group.subgroups.map(subgroup => renderSubgroup(group.id, subgroup, level + 1))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Repositório de Arquivos</h1>
          <button
            onClick={onLogout}
            className="flex items-center px-4 py-2 bg-red-600 rounded-md hover:bg-red-700"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </button>
        </div>

        {!isConnected && (
          <div className="mb-4 p-4 bg-yellow-600 text-white rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Conexão perdida com o servidor. Tentando reconectar...</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Groups Section */}
          <div className="md:col-span-4 bg-gray-800 rounded-lg">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Grupos</h2>
                <FolderPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nome do novo grupo"
                  className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={!isConnected}
                />
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isConnected}
                >
                  Adicionar
                </button>
              </div>
            </div>
            <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
              {groups.map(group => renderGroup(group))}
            </div>
          </div>

          {/* Files Section */}
          <div className="md:col-span-8 bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Arquivos</h2>
              <FileUp className="w-5 h-5 text-blue-500" />
            </div>

            {selectedSubgroup ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Nome do arquivo"
                    className="px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={!isConnected}
                  />
                  <input
                    type="text"
                    value={newFileLink}
                    onChange={(e) => setNewFileLink(e.target.value)}
                    placeholder="Link do arquivo"
                    className="px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={!isConnected}
                  />
                </div>
                <button
                  onClick={handleAddFile}
                  className="w-full px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isConnected}
                >
                  Adicionar Arquivo
                </button>

                <div className="space-y-4">
                  {groups
                    .flatMap(group => group.subgroups)
                    .find(subgroup => subgroup.id === selectedSubgroup)
                    ?.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Link2 className="w-5 h-5 text-blue-500" />
                          <span>{file.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <a
                            href={file.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-400"
                          >
                            Baixar
                          </a>
                          <button
                            onClick={() => handleCopyLink(file.link)}
                            className={`p-1 hover:bg-gray-600 rounded ${
                              copiedLink === file.link ? 'text-green-500' : 'text-blue-500 hover:text-blue-400'
                            }`}
                            title="Copiar link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-500 hover:text-red-400"
                            disabled={!isConnected}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {selectedGroup 
                  ? "Selecione um subgrupo para gerenciar arquivos"
                  : "Selecione um grupo para gerenciar arquivos"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;