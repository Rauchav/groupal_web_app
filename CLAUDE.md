
## Buyer Features — Likes / Saved Deals

### Heart Button on Deal Cards
Every deal card has a heart icon button with this class:
"flex h-8 w-8 items-center justify-center rounded-full 
bg-white/80 backdrop-blur-sm text-gray-400 
hover:text-red-500 hover:bg-white transition-colors 
duration-150 shadow-sm cursor-pointer"

Located over the product image, next to the share button.

### Like Behavior
- Logged-in users can click the heart to like/save a deal
- Heart turns red and filled when a deal is liked
- Heart is gray/outline when not liked
- Clicking again unlikes/removes from saved list
- Guest users clicking heart → prompted to sign in

### Liked Deals Storage
- Liked deals saved to database (UserLikedDeal model)
- Also cached in Zustand store for instant UI response
- Persists across sessions

### Accessing Liked Deals
- Accessible via the authenticated user navbar menu
- Menu items order:
  1. My Group Buys (current and past purchases)
  2. Liked Deals (saved/favorited deals)
  3. Notifications (with unread count badge)
  4. Settings (payment methods, profile, preferences)
  5. Sign Out
- Route: /dashboard/liked
