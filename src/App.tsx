import { createRenderer } from 'fela'
import { RendererProvider } from 'react-fela'
import typescript from 'fela-plugin-typescript'
import MyApp from './MyApp'
import './App.css'
import '../node_modules/normalize.css/normalize.css'

const renderer = createRenderer({
  plugins: [typescript()],
})

export default () => (
  <RendererProvider renderer={renderer}>
    <MyApp />
  </RendererProvider>
)


