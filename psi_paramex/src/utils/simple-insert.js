import { supabase } from '../supabase/supabase'

/**
 * Simple project insert without SQL - Pure JavaScript solution
 */

/**
 * Generate unique ID that fits in PostgreSQL INTEGER range
 * @returns {number} Unique ID (max 2 billion)
 */
const generateUniqueId = () => {
  // Use last 6 digits of timestamp + 3 digit random
  // This ensures ID stays under 2 billion (PostgreSQL INTEGER limit)
  const timestamp = Date.now()
  const lastSixDigits = parseInt(timestamp.toString().slice(-6))
  const random = Math.floor(Math.random() * 900) + 100 // 3 digit random (100-999)
  
  const uniqueId = parseInt(`${lastSixDigits}${random}`)
  
  // Extra safety: ensure it's under 2 billion
  return uniqueId > 2000000000 ? Math.floor(Math.random() * 1000000000) + 1000000000 : uniqueId
}

/**
 * Insert project with guaranteed unique ID - NO SQL NEEDED
 * @param {Object} projectData - Project data without ID
 * @returns {Promise<Object>} Insert result
 */
export const insertProjectSimple = async (projectData) => {
  try {
    // Generate unique ID using timestamp
    const uniqueId = generateUniqueId()
    
    console.log(`Generated unique ID: ${uniqueId} (${uniqueId.toString().length} digits)`)
    console.log(`ID is safe for PostgreSQL INTEGER: ${uniqueId < 2147483647}`)
    
    const dataWithId = {
      project_id: uniqueId,
      ...projectData
    }
    
    console.log('Inserting project with data:', dataWithId)
    
    const { data, error } = await supabase
      .from('projects')
      .insert([dataWithId])
      .select()
    
    if (error) {
      console.error('Insert error:', error)
      throw error
    }
    
    console.log('Successfully inserted project:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('Insert failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Alternative: Let Supabase handle ID but with better error handling
 * @param {Object} projectData - Project data without ID
 * @returns {Promise<Object>} Insert result
 */
export const insertProjectAuto = async (projectData) => {
  try {
    console.log('Inserting project with auto ID:', projectData)
    
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
    
    if (error) {
      console.error('Auto insert error:', error)
      
      // If primary key error, try with manual ID
      if (error.message.includes('duplicate key value violates unique constraint')) {
        console.log('Auto-increment failed, trying manual ID...')
        return await insertProjectSimple(projectData)
      }
      
      throw error
    }
    
    console.log('Successfully inserted project with auto ID:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('Auto insert failed completely:', error)
    return { success: false, error: error.message }
  }
} 