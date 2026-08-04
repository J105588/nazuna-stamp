import { supabase, isSupabaseConfigured, setAdminAuth } from '../lib/supabase';

export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const DEFAULT_SECTIONS = [];
export const DEFAULT_CHECKPOINTS = [];
export const DEFAULT_SETTINGS = {
  isAppStopped: false,
  staffPasscode: "",
  adminPasscode: ""
};

/**
 * DB Manager (Supabase remote DB)
 * LocalStorage caching for sections/checkpoints/settings has been removed per plan.
 */
export const stampDb = {
  /**
   * Fetch system settings from Supabase DB
   */
  getSettingsAsync: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('stamp_system_settings').select('*');
        if (!error && data) {
          const settingsObj = { ...DEFAULT_SETTINGS };
          data.forEach(item => {
            if (item.key === 'is_app_stopped') settingsObj.isAppStopped = Boolean(item.value);
            // staff_passcode and admin_passcode are excluded from public SELECT in RLS,
            // they will only be present if the user is authenticated as Admin.
            if (item.key === 'staff_passcode') settingsObj.staffPasscode = String(item.value || '');
            if (item.key === 'admin_passcode') settingsObj.adminPasscode = String(item.value || '');
          });
          return settingsObj;
        }
      } catch (err) {
        console.error('Error fetching settings from Supabase:', err);
      }
    }
    return DEFAULT_SETTINGS;
  },

  updateSettingsAsync: async (updates) => {
    if (isSupabaseConfigured && supabase) {
      const payload = [];
      if (updates.isAppStopped !== undefined) {
        payload.push({ key: 'is_app_stopped', value: updates.isAppStopped });
      }
      const formatPasscode = (val) => {
        if (!val) return val;
        // If it's a valid integer without leading zero (unless it's exactly "0"), save as Number to avoid JSON quotes
        if (/^(0|[1-9]\d*)$/.test(val)) {
          return Number(val);
        }
        return val;
      };

      if (updates.staffPasscode !== undefined) {
        payload.push({ key: 'staff_passcode', value: formatPasscode(updates.staffPasscode) });
      }
      if (updates.adminPasscode !== undefined) {
        payload.push({ key: 'admin_passcode', value: formatPasscode(updates.adminPasscode) });
      }
      if (payload.length > 0) {
        const { error } = await supabase.from('stamp_system_settings').upsert(payload, { onConflict: 'key' });
        if (error) {
          console.error('Error updating settings in Supabase:', error);
          throw new Error(error.message);
        }
        // If admin passcode was changed, update our client header immediately
        if (updates.adminPasscode !== undefined) {
          setAdminAuth(updates.adminPasscode);
        }
      }
    }
    return await stampDb.getSettingsAsync();
  },

  /**
   * Fetch sections from Supabase DB
   */
  getSectionsAsync: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('stamp_sections')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data) {
          return data.map(sec => ({
            id: sec.id,
            name: sec.name,
            description: sec.description || '',
            order: sec.display_order || 0
          }));
        }
      } catch (err) {
        console.error('Error fetching sections from Supabase:', err);
      }
    }
    return DEFAULT_SECTIONS;
  },

  addSectionAsync: async (name, description = '') => {
    const newId = generateUUID();
    const sections = await stampDb.getSectionsAsync();
    const newOrder = sections.length + 1;
    
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('stamp_sections').insert([{
        id: newId,
        name,
        description,
        display_order: newOrder
      }]);
      if (error) {
        console.error('Error adding section to Supabase:', error);
        throw new Error(error.message);
      }
    }
  },

  updateSectionAsync: async (id, updates) => {
    if (isSupabaseConfigured && supabase) {
      const payload = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.order !== undefined) payload.display_order = updates.order;
      
      const { error } = await supabase.from('stamp_sections').update(payload).eq('id', id);
      if (error) {
        console.error('Error updating section in Supabase:', error);
        throw new Error(error.message);
      }
    }
  },

  deleteSectionAsync: async (id) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('stamp_sections').delete().eq('id', id);
      if (error) {
        console.error('Error deleting section from Supabase:', error);
        throw new Error(error.message);
      }
    }
  },

  /**
   * Fetch checkpoints from Supabase DB
   */
  getCheckpointsAsync: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('stamp_checkpoints')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data) {
          return data.map(cp => ({
            id: cp.id,
            qrId: cp.qr_id || cp.id,
            lat: parseFloat(cp.lat),
            lon: parseFloat(cp.lon),
            sectionId: cp.section_id,
            order: cp.display_order || 0,
            name: cp.name || undefined,
            description: cp.description || undefined,
            stampIcon: cp.stamp_icon || undefined
          }));
        }
      } catch (err) {
        console.error('Error fetching checkpoints from Supabase:', err);
      }
    }
    return DEFAULT_CHECKPOINTS;
  },

  addCheckpointAsync: async ({ lat, lon, sectionId, qrId, name, description, stampIcon, order }) => {
    const checkpoints = await stampDb.getCheckpointsAsync();
    const uuid = qrId || generateUUID();
    const sectionCps = checkpoints.filter(c => c.sectionId === sectionId);
    const newOrder = order !== undefined && order !== '' ? parseInt(order, 10) : (sectionCps.length + 1);
    
    if (isSupabaseConfigured && supabase) {
      const payload = {
        id: uuid,
        qr_id: uuid,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        section_id: sectionId,
        display_order: newOrder
      };
      payload.name = name || 'スポット';
      if (description !== undefined) payload.description = description;
      if (stampIcon) payload.stamp_icon = stampIcon;
      const { error } = await supabase.from('stamp_checkpoints').insert([payload]);
      if (error) {
        console.error('Error adding checkpoint to Supabase:', error);
        throw new Error(error.message);
      }
    }
  },

  updateCheckpointAsync: async (id, updates) => {
    if (isSupabaseConfigured && supabase) {
      const payload = {};
      if (updates.lat !== undefined) payload.lat = parseFloat(updates.lat);
      if (updates.lon !== undefined) payload.lon = parseFloat(updates.lon);
      if (updates.sectionId !== undefined) payload.section_id = updates.sectionId;
      if (updates.order !== undefined) payload.display_order = updates.order;
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.stampIcon !== undefined) payload.stamp_icon = updates.stampIcon;
      
      const { error } = await supabase.from('stamp_checkpoints').update(payload).eq('id', id);
      if (error) {
        console.error('Error updating checkpoint in Supabase:', error);
        throw new Error(error.message);
      }
    }
  },

  deleteCheckpointAsync: async (id) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('stamp_checkpoints').delete().eq('id', id);
      if (error) {
        console.error('Error deleting checkpoint from Supabase:', error);
        throw new Error(error.message);
      }
    }
  },

  resetToDefaultsAsync: async () => {
    if (isSupabaseConfigured && supabase) {
      const { error: err1 } = await supabase.from('stamp_checkpoints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (err1) throw new Error(err1.message);
      
      const { error: err2 } = await supabase.from('stamp_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (err2) throw new Error(err2.message);
      
      const { error: err3 } = await supabase.from('stamp_system_settings').delete().neq('key', '');
      if (err3) throw new Error(err3.message);
    }
  }
};
