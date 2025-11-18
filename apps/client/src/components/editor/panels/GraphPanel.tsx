import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';
import { notesApi } from '@/lib/api/notesApi';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { useNavigate } from 'react-router-dom';

/**
 * Assumes notesApi.getAllNotes(limit, offset) => Promise<{ notes: Note[], pagination: { hasMore, offset, pageNum } }>
 * Each note may include `child_wikilinks` and `parent_wikilinks` arrays with parent_note/child_note objects (as in your backend).
 */

type NoteShort = {
  id: number | string;
  title: string;
  note_uid?: string;
  wordCount?: number;
  pinned?: boolean;
  child_wikilinks?: any[];
  parent_wikilinks?: any[];
  content?: any;
  updated_at?: string;
};

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  size: number;
  isPinned: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

const PAGE_LIMIT = 5; // safe for <100 scenario (will fetch two pages max)

export function GraphPanel() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { setCurrentNote, currentNoteId } = useEnhancedNoteStore();
  const navigate = useNavigate();

  // ---------- Fetch notes (infinite) ----------
  const fetchNotes = useCallback(async (context: { pageParam?: unknown }) => {
    const offset = typeof context.pageParam === 'number' ? context.pageParam : 0;
    // notesApi.getAllNotes(limit, offset) should return { notes: [], pagination: { hasMore, offset, pageNum } }
    const res = await notesApi.getAllNotes(PAGE_LIMIT, offset);
    return res; // return the full response, not just notes
  }, []);

  const notesQuery = useInfiniteQuery({
    queryKey: ['graph', 'notes'],
    queryFn: fetchNotes,
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) => {
      // lastPage.pagination.hasMore & offset
      const p = lastPage.pagination;
      if (p?.hasMore) return p.offset + PAGE_LIMIT;
      return undefined;
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  // Flatten notes into a map for quick lookup
  const notesMap: Record<string, NoteShort> = useMemo(() => {
    const map: Record<string, NoteShort> = {};
    if (!notesQuery.data) return map;
    notesQuery.data.pages.forEach((page: any) => {
      (page.notes || []).forEach((n: NoteShort) => {
        map[String(n.id)] = {
          ...n,
          // normalize fields if needed
          id: n.id,
          title: n.title || 'Untitled',
          wordCount: (n.wordCount ?? (countWordsFromContent(n.content) ?? 0)),
          pinned: !!n.pinned,
        };
      });
    });
    return map;
  }, [notesQuery.data]);

  // Build graph data from notesMap
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkMap = new Map<string, GraphLink>();

    // nodes
    Object.values(notesMap).forEach(n => {
      const id = String(n.id);
      nodeMap.set(id, {
        id,
        title: n.title,
        size: Math.max(n.wordCount ?? 10, 10),
        isPinned: !!n.pinned,
      });
    });

    // links: prefer backend wikilink relations for reliability
    Object.values(notesMap).forEach(n => {
      const sourceId = String(n.id);

      // use child_wikilinks on the source (n) to get outgoing links
      const childLinks = n.child_wikilinks || [];
      if (childLinks.length) {
        childLinks.forEach((wl: any) => {
          const target = wl.child_note?.id ?? wl.child_note_id;
          if (!target) return;
          const targetId = String(target);
          if (!nodeMap.has(targetId)) return; // target not loaded yet
          const key = `${sourceId}-${targetId}`;
          const prev = linkMap.get(key);
          if (prev) prev.value += 1;
          else linkMap.set(key, { source: sourceId, target: targetId, value: 1 });
        });
      }

      // also consider parent_wikilinks (if present) - this covers flipped relations
      const parentLinks = n.parent_wikilinks || [];
      if (parentLinks.length) {
        parentLinks.forEach((wl: any) => {
          const parent = wl.parent_note?.id ?? wl.parent_note_id;
          if (!parent) return;
          const parentId = String(parent);
          if (!nodeMap.has(parentId)) return;
          const key = `${parentId}-${sourceId}`; // parent -> child
          const prev = linkMap.get(key);
          if (prev) prev.value += 1;
          else linkMap.set(key, { source: parentId, target: sourceId, value: 1 });
        });
      }

      // fallback: parse content for [[Name]] and try to resolve by title (only if backend relations missing)
      if (!childLinks.length && !parentLinks.length && n.content?.blocks) {
        parseWikilinksFromContent(n.content).forEach(linkedTitle => {
          // attempt to find note by exact title
          const found = Object.values(notesMap).find(x => normalizeTitle(x.title) === normalizeTitle(linkedTitle));
          if (!found) return;
          const targetId = String(found.id);
          const key = `${sourceId}-${targetId}`;
          const prev = linkMap.get(key);
          if (prev) prev.value += 1;
          else linkMap.set(key, { source: sourceId, target: targetId, value: 1 });
        });
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
    };
  }, [notesMap]);

  // ---------- D3 rendering ----------
  useEffect(() => {
    const svgEl = svgRef.current;
    const container = wrapperRef.current;
    if (!svgEl || !container) return;

    // clear previous
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('width', width).attr('height', height);

    if (nodes.length === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .text('Create notes with [[links]] to see the graph');
      return;
    }

    // groups
    const g = svg.append('g');

    // zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Build simulation
const simNodes: GraphNode[] = nodes.map(n => ({ 
  ...n,
  fx: undefined,  // Clear any fixed x position
  fy: undefined   // Clear any fixed y position
}));
 // ensure type
    const simLinks = links.map(l => ({ ...l }));

    const chargeStrength = Math.max(-300, -30 * nodes.length);
const simulation = d3.forceSimulation<GraphNode>(simNodes)
  .force('link', d3.forceLink<GraphNode, GraphLink>(simLinks)
    .id(d => d.id)
    .distance(110)
    .strength(0.8))
  .force('charge', d3.forceManyBody().strength(chargeStrength))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide<GraphNode>()
    .radius(d => Math.sqrt(d.size) * 8 + 6)
    .strength(0.9))  // Increase collision strength
  .force("x", d3.forceX(width / 2).strength(0.15))  // Stronger centering
  .force("y", d3.forceY(height / 2).strength(0.15))
  .alphaDecay(0.02)  // Slower decay = more stable
  .velocityDecay(0.4);  // Higher friction = less drift

    // links
    const link = g.append('g')
      .attr('stroke', '#E5E7EB')
      .selectAll('line')
      .data(simLinks)
      .enter().append('line')
      .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value)));

    // nodes
    const node = g.append('g')
      .selectAll('g')
      .data(simNodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          // keep node anchored where user left (optional)
          d.fx = d.x;
          d.fy = d.y;
        }));

    node.append('circle')
      .attr('r', d => Math.sqrt(d.size) * 6 + 6)
      .attr('fill', d => {
        if (String(d.id) === String(currentNoteId)) return '#3B82F6';
        if (d.isPinned) return '#F59E0B';
        return '#6B7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => (d.title.length > 14 ? d.title.slice(0, 14) + '…' : d.title))
      .attr('x', 0)
      .attr('y', d => Math.sqrt(d.size) * 6 + 20)
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('fill', '#374151')
      .style('font-size', '11px')
      .style('font-weight', 600);

    // tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('padding', '6px 8px')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('font-size', '12px')
      .style('border-radius', '6px')
      .style('pointer-events', 'none')
      .style('opacity', '0');

    node.on('mouseover', function (event, d) {
      d3.select(this).select('circle').attr('stroke-width', 3);
      const note = notesMap[d.id];
      tooltip.html(`<strong>${escapeHtml(d.title)}</strong><div style="font-size:11px;opacity:0.9">${note?.wordCount ?? 0} words${d.isPinned ? ' • 📌' : ''}</div>`)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition().duration(120).style('opacity', '1');
    }).on('mouseout', function () {
      d3.select(this).select('circle').attr('stroke-width', 2);
      tooltip.transition().duration(120).style('opacity', '0');
    }).on('click', (event, d) => {
      event.stopPropagation();
      // set current note in your store (string)
      setCurrentNote(String(d.id));
      const note = notesMap[d.id];
      if (note && note.note_uid) {
        navigate(`/note/${note.note_uid}`);
      } else {
        console.warn(`Note UID not found for note id: ${d.id}`);
      }
    });

  let hasStabilized = false;

simulation.on('tick', () => {
  // Constrain node positions
  simNodes.forEach(d => {
    const radius = Math.sqrt(d.size) * 6 + 6;
    d.x = Math.max(radius + 10, Math.min(width - radius - 10, d.x || 0));
    d.y = Math.max(radius + 10, Math.min(height - radius - 10, d.y || 0));
  });
  
  // Auto-fit once when simulation stabilizes
  if (simulation.alpha() < 0.05 && !hasStabilized) {
    hasStabilized = true;
    performAutoFit();
  }
  
  // Update link positions
  link
    .attr('x1', d => (d.source as GraphNode).x!)
    .attr('y1', d => (d.source as GraphNode).y!)
    .attr('x2', d => (d.target as GraphNode).x!)
    .attr('y2', d => (d.target as GraphNode).y!);
  
  // Update node positions
  node.attr('transform', d => `translate(${d.x},${d.y})`);
});
function performAutoFit() {
  if (simNodes.length === 0) return;
  
  const xValues = simNodes.map(n => n.x!);
  const yValues = simNodes.map(n => n.y!);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;
  
  const padding = 80;
  const scale = Math.min(
    width / (graphWidth + padding),
    height / (graphHeight + padding),
    1
  );
  
  const translateX = (width - graphWidth * scale) / 2 - minX * scale;
  const translateY = (height - graphHeight * scale) / 2 - minY * scale;
  
  const transform = d3.zoomIdentity
    .translate(translateX, translateY)
    .scale(scale);
  
  svg.transition()
    .duration(500)
    .call(zoom.transform as any, transform)
    .on('end', () => {
      // Stop simulation AFTER the zoom animation completes
      simulation.stop();
    });
}



  // --- AUTO FIT GRAPH TO VIEW (Obsidian-style) ---
  simulation.on("end", () => {
  if (simNodes.length === 0) return;
  
  const xValues = simNodes.map(n => n.x!);
  const yValues = simNodes.map(n => n.y!);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;
  
  const padding = 80;
  const scale = Math.min(
    width / (graphWidth + padding),
    height / (graphHeight + padding),
    1
  );
  
  const translateX = (width - graphWidth * scale) / 2 - minX * scale;
  const translateY = (height - graphHeight * scale) / 2 - minY * scale;
  
  const transform = d3.zoomIdentity
    .translate(translateX, translateY)
    .scale(scale);
  
  svg.transition().duration(500).call(zoom.transform as any, transform);
  
  // CRITICAL: Stop simulation after fitting
  simulation.stop();
});




    // zoom to current note if set
    if (currentNoteId) {
      const nodeToFocus = simNodes.find(n => String(n.id) === String(currentNoteId));
      if (nodeToFocus) {
        // center the node
        const transform = d3.zoomIdentity.translate(width / 2 - (nodeToFocus.x ?? 0), height / 2 - (nodeToFocus.y ?? 0)).scale(1.2);
        svg.transition().duration(700).call(zoom.transform as any, transform);
      }
    }

    // Add resize observer to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      svg.attr('width', newWidth).attr('height', newHeight);
      
      // Update forces for new dimensions
      simulation
        .force('center', d3.forceCenter(newWidth / 2, newHeight / 2))
        .force("x", d3.forceX(newWidth / 2).strength(0.1))
        .force("y", d3.forceY(newHeight / 2).strength(0.1))
        .alpha(0.3)
        .restart();
    });
    
    resizeObserver.observe(container);

    // cleanup function
    return () => {
      simulation.stop();
      tooltip.remove();
      svg.selectAll('*').remove();
      resizeObserver.disconnect();
    };
  }, [nodes, links, notesMap, setCurrentNote, currentNoteId]);

  // Auto fetch all pages for <100 notes scenario
  useEffect(() => {
    if (!notesQuery.data) return;
    // If there is a next page, keep fetching until we have all notes or threshold
    if (notesQuery.hasNextPage) {
      // safety: don't auto-fetch infinitely — cap to 5 pages
      notesQuery.fetchNextPage();
    }
    // You can refine logic: fetch sequentially until hasMore false
  }, [notesQuery.data, notesQuery.hasNextPage, notesQuery.fetchNextPage]);

  const notesCount = Object.keys(notesMap).length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={16} />
            Graph View
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="secondary" className="text-xs">{notesCount} notes</Badge>
            <Badge variant="secondary" className="text-xs">{links.length} links</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div ref={wrapperRef} className="w-full h-[64vh] relative">
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- helper utilities ---------------- */

function normalizeTitle(t: string | undefined) {
  return (t || '').trim().toLowerCase();
}

function parseWikilinksFromContent(content: any): string[] {
  // simple fallback parser: finds [[Name]] in block.data.text
  if (!content?.blocks) return [];
  const found = new Set<string>();
  const regex = /\[\[([^\]]+)\]\]/g;
  content.blocks.forEach((b: any) => {
    const text = b?.data?.text;
    if (!text || typeof text !== 'string') return;
    let m;
    while ((m = regex.exec(text)) !== null) {
      found.add(m[1].trim());
    }
  });
  return Array.from(found);
}

function countWordsFromContent(content: any): number {
  if (!content?.blocks) return 0;
  let count = 0;
  content.blocks.forEach((b: any) => {
    const t = b?.data?.text;
    if (!t || typeof t !== 'string') return;
    const clean = t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    count += clean.split(' ').length;
  });
  return count;
}

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string));
}
