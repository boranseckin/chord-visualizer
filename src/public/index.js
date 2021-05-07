const nodeSet = new vis.DataSet([]);
const edgeSet = new vis.DataSet([]);
const data = { nodes: nodeSet, edges: edgeSet };

const container = document.getElementById("network");
const options = {
    autoResize: true,
    nodes: {
        shape: 'circle',
    },
    edges: {
        length: 160,
    },
    interaction: {
        dragView: false,
        zoomSpeed: 0.5,
    },
    physics: {
        maxVelocity: 5,
    }
};
const network = new vis.Network(container, data, options);

async function loadData() {
    const response = await fetch('./data.json').catch(err => console.log(err));
    const { anchor, nodes, edges } = await response.json();

    const p = document.getElementById('anchor');
    if (anchor.isAlive) {
        p.innerHTML = `Anchor: ${anchor.node.id} - ${anchor.node.hash} - ${anchor.node.address}:${anchor.node.port}`;
    } else {
        p.innerHTML = 'Anchor: N/A';
    }

    const pre = document.getElementById('data');
    const simpleNodes = nodes.map((node) => {
        return node.data.node;
    })
    pre.innerHTML = JSON.stringify({ nodes: simpleNodes, edges }, undefined, 2);
    
    const updatedNodes = nodeSet.update(nodes);
    const updatedEdges = edgeSet.update(edges);

    if (nodeSet.length > updatedNodes.length) {
        nodeSet.forEach((_, i) => {
            if (!updatedNodes.includes(i)) {
                nodeSet.remove(i);
            }
        });
    }

    if (edgeSet.length > updatedEdges.length) {
        edgeSet.forEach((_, i) => {
            if (!updatedEdges.includes(i)) {
                edgeSet.remove(i);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();

    setInterval(() => {
        loadData();
    }, 2000);
});
