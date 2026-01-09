import { reactive } from 'vue'

const state = reactive({
    toasts: []
})

let idCounter = 0

export const useToast = () => {
    const add = (message, type = 'info', duration = 3000) => {
        const id = idCounter++
        state.toasts.push({ id, message, type })
        setTimeout(() => remove(id), duration)
    }

    const remove = (id) => {
        const index = state.toasts.findIndex(t => t.id === id)
        if (index !== -1) state.toasts.splice(index, 1)
    }

    return {
        toasts: state.toasts,
        add,
        remove,
        success: (msg) => add(msg, 'success'),
        error: (msg) => add(msg, 'error'),
        info: (msg) => add(msg, 'info')
    }
}
