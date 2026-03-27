export interface Theme {
  title: string
  text: string
  icon: string
  bg: string
  border: string
}

export const themes: Record<string, Theme> = {
  default:    { title: '2f80ed', text: '434d58', icon: '4c71f2', bg: 'fffefe', border: 'e4e2e2' },
  dark:       { title: 'fff',    text: '9f9f9f', icon: '79ff97', bg: '151515', border: '444'    },
  radical:    { title: 'fe428e', text: 'a9fef7', icon: 'f8d847', bg: '141321', border: 'fe428e' },
  tokyonight: { title: '70a5fd', text: '38bdae', icon: '70a5fd', bg: '1a1b27', border: '70a5fd' },
  dracula:    { title: 'ff6e96', text: 'a4ffff', icon: 'ff6e96', bg: '282a36', border: 'ff6e96' },
  gruvbox:    { title: 'fabd2f', text: 'ebdbb2', icon: 'fabd2f', bg: '282828', border: 'fabd2f' },
  onedark:    { title: 'e4bf7a', text: 'df6d74', icon: '42b883', bg: '282c34', border: '282c34' },
  transparent:{ title: '6e40c9', text: '333',    icon: '586069', bg: '00000000', border: '00000000' },
}
