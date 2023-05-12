function loadAndExposeModule(moduleName, context=globalThis) {
    import(moduleName).then(module => {
        Object.assign(context, module);
    })
}

globalThis.loadAndExposeModule = loadAndExposeModule;
