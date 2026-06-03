import './polyfills'
import './style.css'

import { initRouter } from './router'
import { renderRoute } from './app/renderRoute'

initRouter(renderRoute)
