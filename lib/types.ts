export type Tier = 'S+' | 'S' | 'A' | 'B' | 'C' | null

export interface SideDish {
  id: string
  name: string
  photo_url: string | null
  appearance: number
  taste: number
  ease: number
  smell: number
  texture: number
  total: number
  created_at: string
}

export interface BentoSideDish {
  id: string
  bento_id: string
  side_dish_id: string
  side_dishes: SideDish
}

export interface Bento {
  id: string
  name: string
  store_name: string
  photo_url: string
  created_at: string
  updated_at: string
  bento_side_dishes?: BentoSideDish[]
  score?: number
  tier?: Tier
}

export interface User {
  id: string
  passphrase_hash: string
  created_at: string
}

export type SideDishParams = {
  name: string
  photo_url?: string | null
  appearance: number
  taste: number
  ease: number
  smell: number
  texture: number
}
