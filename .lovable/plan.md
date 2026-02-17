
# Add Telegram to Social Media Profile Avatars

## What Changes

The previously approved plan for social media mini-avatars around the profile avatar will now include **5 platforms** instead of 4:

1. Facebook
2. YouTube
3. X / Twitter
4. TikTok
5. **Telegram** (new addition)

## Database Migration

Add 5 new nullable text columns to the `profiles` table:
- `facebook_url`
- `youtube_url`
- `twitter_url`
- `tiktok_url`
- `telegram_url`

## Social Media Icon Layout

```text
           [Diamond]
        /    Avatar    \
       /                \
  [FB] [YT] [X] [TT] [TG]
    (bottom arc of avatar)
```

- 5 small icons (20-24px) positioned along the bottom arc of the avatar
- Each icon uses the platform's brand color (Telegram = #0088cc)
- Tooltip on hover shows the link; clicking opens the social profile
- Only visible when the user has filled in the URL

## Files to Change

1. **Database migration** -- add 5 columns to `profiles`
2. **`src/components/Profile/ProfileHeader.tsx`** -- add `SocialMediaOrbit` with 5 icons + diamond badge
3. **`src/pages/ProfileSettings.tsx`** -- add 5 social media URL input fields in settings
4. **`src/pages/UserProfile.tsx`** -- pass social URL data to ProfileHeader
5. **`src/components/Profile/ProfileInfo.tsx`** -- pass social URL data through

## Diamond Credibility Badge (unchanged from previous plan)

- Silver: 0-99 CAMLY
- Blue: 100-999 CAMLY
- Purple: 1000-4999 CAMLY
- Gold: 5000+ CAMLY (Light Angel)

Sparkling animation at top of avatar.

## Technical Notes

- Telegram icon uses the `Send` icon from lucide-react (already used in ShareModal)
- All social links are optional -- icons only render when URL is provided
- Basic URL validation before saving
- No edge functions needed; purely client-side + DB columns
