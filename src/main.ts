import { mount } from 'svelte'
import './app.css'
import App from './core/infrastructure/presentation/routes/App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
