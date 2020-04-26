const fileIn = document.getElementById('file_in');
const blockUl = document.getElementById('block_list');
const entityUl = document.getElementById('entity_list');
const errorDiv = document.getElementById('error_div');
const statusDiv = document.getElementById('status_div');
fileIn.addEventListener('change', ev => {
    const statusIndicator = setTimeout(() => {
        errorDiv.innerHTML = '';
        blockUl.innerHTML = '';
        entityUl.innerHTML = '';
        statusDiv.innerHTML = 'Analyzing... Please wait...';
    }, 500);
    ev.cancelBubble = true;
    ev.preventDefault();
    const data = new FormData();
    data.append('structure', fileIn.files[0]);
    fetch('analyze', {
        method: 'POST',
        body: data
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            throw data;
        }
        blockUl.innerHTML = '';
        entityUl.innerHTML = '';
        const blocks = Object.entries(data.blockCounts);
        if (blocks.length > 0) {
            const li = document.createElement('li');
            li.classList.add('list-header');
            li.innerHTML = 'Blocks Needed:';
            blockUl.appendChild(li);
            for (const entry of blocks) {
                const li = document.createElement('li');
                li.innerHTML = `${entry[0]} &times; ${entry[1]}`;
                blockUl.appendChild(li);
            }
        } else {
            const li = document.createElement('li');
            li.classList.add('list-header');
            li.innerHTML = 'No Blocks Needed';
            blockUl.appendChild(li);
        }

        const entities = Object.entries(data.entityCounts);
        if (entities.length > 0) {
            const li = document.createElement('li');
            li.classList.add('list-header');
            li.innerHTML = 'Entities Needed:';
            entityUl.appendChild(li);
            for (const entry of entities) {
                const li = document.createElement('li');
                li.innerHTML = `${entry[0]} &times; ${entry[1]}`;
                entityUl.appendChild(li);
            }
        } else {
            const li = document.createElement('li');
            li.classList.add('list-header');
            li.innerHTML = 'No Entities Needed';
            blockUl.appendChild(li);  
        }
    })
    .catch(er => {
        blockUl.innerHTML = '';
        entityUl.innerHTML = '';
        errorDiv.innerHTML = er.code;
    })
    .finally(() => {
        clearTimeout(statusIndicator);
        statusDiv.innerHTML = '';
    });
    return false;
});