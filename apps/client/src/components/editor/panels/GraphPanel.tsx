import React, { useEffect, useRef } from 'react';
import { useEnhancedNoteStore } from '@/stores/enhancedNoteStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, ZoomIn, ZoomOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: number;
  size: number;
  isPinned: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

export function GraphPanel() {
  const { notes, setCurrentNote, currentNoteId } = useEnhancedNoteStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous graph
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.attr("width", width).attr("height", height);
    
    // Create graph data
    const { nodes, links } = createGraphData();
    
    if (nodes.length === 0) {
      // Show empty state
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("class", "fill-gray-500 text-sm")
        .text("Create notes with [[links]] to see the graph");
      return;
    }
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Create main group for zooming
    const g = svg.append("g");
    
    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes as GraphNode[])
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: GraphNode) => Math.sqrt(d.size) * 8 + 5));
    
    // Create links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("class", "stroke-gray-300")
      .attr("stroke-width", d => Math.sqrt(d.value) * 2);
    
    // Create nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "cursor-pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add circles for nodes
    node.append("circle")
      .attr("r", d => Math.sqrt(d.size) * 8 + 5)
      .attr("fill", d => {
        if (d.id === currentNoteId) return "#3B82F6"; // Current note - blue
        if (d.isPinned) return "#F59E0B"; // Pinned - yellow
        return "#6B7280"; // Default - gray
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", "hover:opacity-80 transition-opacity");
    
    // Add labels
    node.append("text")
      .text(d => d.name.length > 12 ? d.name.substring(0, 12) + "..." : d.name)
      .attr("x", 0)
      .attr("y", d => Math.sqrt(d.size) * 8 + 20)
      .attr("text-anchor", "middle")
      .attr("class", "fill-gray-700 text-xs font-medium pointer-events-none");
    
    // Add click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      setCurrentNote(d.id);
    });
    
    // Add hover effects
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", 3);
      
      // Show tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "absolute bg-black text-white px-2 py-1 rounded text-xs pointer-events-none z-50")
        .style("opacity", 0);
      
      tooltip.transition()
        .duration(200)
        .style("opacity", 1);
      
      tooltip.html(`
        <div><strong>${d.name}</strong></div>
        <div>${Object.values(notes).find(n => n.id === d.id)?.wordCount || 0} words</div>
        ${d.isPinned ? '<div>📌 Pinned</div>' : ''}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
        
      d3.select(this).attr("data-tooltip", "true");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).select("circle").attr("stroke-width", 2);
      d3.selectAll("div").filter(function() {
        return d3.select(this).classed("absolute") && 
               d3.select(this).style("opacity") === "1";
      }).remove();
    });
    
    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);
      
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // Zoom controls
    const zoomControls = svg.append("g")
      .attr("class", "zoom-controls")
      .attr("transform", `translate(${width - 60}, 20)`);
    
    // Zoom in button
    const zoomInButton = zoomControls.append("g")
      .attr("class", "cursor-pointer")
      .on("click", () => {
        svg.transition().duration(300).call(
          zoom.scaleBy as any, 1.5
        );
      });
    
    zoomInButton.append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("rx", 4)
      .attr("class", "fill-white stroke-gray-300 hover:fill-gray-50");
    
    zoomInButton.append("text")
      .attr("x", 15)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("class", "fill-gray-700 text-lg font-bold pointer-events-none")
      .text("+");
    
    // Zoom out button
    const zoomOutButton = zoomControls.append("g")
      .attr("class", "cursor-pointer")
      .attr("transform", "translate(0, 35)")
      .on("click", () => {
        svg.transition().duration(300).call(
          zoom.scaleBy as any, 0.67
        );
      });
    
    zoomOutButton.append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("rx", 4)
      .attr("class", "fill-white stroke-gray-300 hover:fill-gray-50");
    
    zoomOutButton.append("text")
      .attr("x", 15)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("class", "fill-gray-700 text-lg font-bold pointer-events-none")
      .text("−");
    
    // Reset zoom button
    const resetButton = zoomControls.append("g")
      .attr("class", "cursor-pointer")
      .attr("transform", "translate(0, 70)")
      .on("click", () => {
        svg.transition().duration(500).call(
          zoom.transform as any,
          d3.zoomIdentity.translate(0, 0).scale(1)
        );
      });
    
    resetButton.append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("rx", 4)
      .attr("class", "fill-white stroke-gray-300 hover:fill-gray-50");
    
    resetButton.append("text")
      .attr("x", 15)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("class", "fill-gray-700 text-sm font-bold pointer-events-none")
      .text("⌂");
    
    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
  }, [notes, currentNoteId, setCurrentNote]);
  
  // Create graph data from notes
  const createGraphData = (): { nodes: GraphNode[], links: GraphLink[] } => {
    const nodeMap = new Map<string, GraphNode>();
    const linkMap = new Map<string, GraphLink>();
    
    // Create nodes for all notes
    Object.values(notes).forEach(note => {
      nodeMap.set(note.id, {
        id: note.id,
        name: note.name,
        group: 1,
        size: Math.max(note.wordCount, 10), // Minimum size for visibility
        isPinned: note.isPinned,
      });
    });
    
    // Create links based on [[]] references
    Object.values(notes).forEach(note => {
      if (!note.content?.blocks) return;
      
      note.content.blocks.forEach(block => {
        if (block.data?.text) {
          const text = block.data.text;
          const linkRegex = /\[\[([^\]]+)\]\]/g;
          let match;
          
          while ((match = linkRegex.exec(text)) !== null) {
            const linkedNoteName = match[1].trim();
            
            // Find the target note by name
            const targetNote = Object.values(notes).find(n => n.name === linkedNoteName);
            if (targetNote) {
              const linkKey = `${note.id}-${targetNote.id}`;
              const existingLink = linkMap.get(linkKey);
              
              if (existingLink) {
                existingLink.value += 1;
              } else {
                linkMap.set(linkKey, {
                  source: note.id,
                  target: targetNote.id,
                  value: 1,
                });
              }
            }
          }
        }
      });
    });
    
    return {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values()),
    };
  };
  
  const { nodes, links } = createGraphData();
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={16} />
            Graph View
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="secondary" className="text-xs">
              {nodes.length} notes
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {links.length} links
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="w-full h-96 relative">
          <svg ref={svgRef} className="w-full h-full border-t border-gray-200" />
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm text-center">
              <div>
                <Network size={48} className="mx-auto mb-4 opacity-50" />
                <div>Create notes with [[links]] to see the graph</div>
                <div className="text-xs mt-2">
                  Use [[Note Name]] syntax to link between notes
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}