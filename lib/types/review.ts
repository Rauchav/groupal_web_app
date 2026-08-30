export interface DealReview {
  id:        string
  dealId:    string
  buyerId:   string
  buyerName: string
  rating:    number // 0–5
  comment:   string
  createdAt: string
}
