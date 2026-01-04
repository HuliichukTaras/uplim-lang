interface ProfileStatsProps {
  postsCount: number
  followersCount: number
  followingCount: number
}

export function ProfileStats({ postsCount, followersCount, followingCount }: ProfileStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="flex gap-6 mt-6">
      <div className="text-center">
        <p className="font-bold text-lg">{formatNumber(postsCount)}</p>
        <p className="text-sm text-muted-foreground">posts</p>
      </div>
      <div className="text-center">
        <p className="font-bold text-lg">{formatNumber(followersCount)}</p>
        <p className="text-sm text-muted-foreground">followers</p>
      </div>
      <div className="text-center">
        <p className="font-bold text-lg">{formatNumber(followingCount)}</p>
        <p className="text-sm text-muted-foreground">following</p>
      </div>
    </div>
  )
}
