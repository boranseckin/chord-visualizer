#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const express = require('express');

const { default: Node, M } = require('@boranseckin/chord');

const PUBLIC = path.resolve(__dirname, './public');

/* ========== Chord ========== */

function isSame(a, b) {
    return (a.id === b.id)
    && (a.hash === b.hash)
    && (a.address === b.address)
    && (a.port === b.port);
}

class Visualizer extends Node {
    nodes = [];
    edges = [];

    anchor = undefined;
    isAnchor = true;

    constructor(address, port, anchor, callback) {
        super(-1, address, port, undefined, async () => {
            this.anchor = anchor;
            console.log('Anchor is', this.anchor);

            await this.step(anchor);

            callback();
        });
    }

    // Override getInfo method
    async getInfo(node) {
        const { id, hash, address, port } = node;
        try {
            return await this.execute('getInfo', { id, hash, address, port });
        } catch {
            return undefined;
        }
    }

    async walk() {
        const lastNodes = this.nodes;

        this.nodes = [];
        this.edges = [];

        if (!await this.step(this.anchor)) {
            this.isAnchor = false;

            if (lastNodes.length < 2) return;

            let i = this.anchor.id;

            while (i === this.anchor.id || !lastNodes[i]) {
                i = Math.floor(Math.random() * lastNodes.length);
            }

            this.anchor = lastNodes[i].data;
            this.isAnchor = true;
            console.log('Anchor is changed to', this.anchor);
            return;
        }

        this.isAnchor = true;
    }

    /**
     * Crawl the network by stepping towards the predecessors of the nodes.
     */
    async step(node) {
        const info = await this.getInfo(node);
        
        // Node unavailable, stop stepping.
        if (!info) return false;
        const { node: n, pre, suc, finger } = info;

        // Returned back to the beginning, stop stepping.
        if (this.nodes[0]?.id === n.id) return true;

        // Add this node to the new nodes list.
        this.nodes.push({
            id: n.id,
            label: `${n.id} - ${n.hash}`,
            data: {
                node: n,
                pre,
                suc,
                finger,
            },
        });

        // If this is not the first node, add an edge from successor to this node.
        if (this.nodes.length > 1) {
            this.edges.push({
                id: suc.id,
                from: suc.id,
                to: n.id,
            });
        }

        // If the next node is the first node, add an edge to finish the circle.
        if (this.nodes[0].id === pre.id) {
            this.edges.push({
                id: n.id,
                from: n.id,
                to: pre.id,
            });
            return true;
        }
        
        // If the next node is different, continue stepping.
        if (!isSame(n, pre)) {
            return await this.step(pre);
        }

        return true;
    }

    /**
     * Save the node and edge data for static serving.
     */
    saveData() {
        fs.writeFileSync(`${PUBLIC}/data.json`, JSON.stringify({
            anchor: {
                node: this.anchor,
                isAlive: this.isAnchor,
            },
            nodes: this.nodes,
            edges: this.edges
        }));
    }
}

const vis = new Visualizer('127.0.0.1', 55555, { id: 0, hash: 'F04F1F', address: '127.0.0.1', port: 50000}, () => {
    setInterval(async () => {
        await vis.walk();
        vis.saveData();
    }, 2000);
});

/* ========== Express ========== */

const app = express();

app.use('/', express.static(path.join(__dirname, 'public')));

app.listen(8080, () => {
    console.log('Listening at http://localhost:8080');
});
