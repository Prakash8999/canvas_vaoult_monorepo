import React from "react";
import { useNavigate } from "react-router-dom";
import { useEnhancedNoteStore } from "@/stores/enhancedNoteStore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import { Link as LinkIcon, CornerUpRight, CornerUpLeft, Calendar } from "lucide-react";

export function LinkRelationsPanel({ note_id }: { note_id: string }) {
  const navigate = useNavigate();
  const { frontLinks, getBacklinks } = useEnhancedNoteStore();

  const backlinkLinks = getBacklinks(note_id); // backend wikilink objects
  const outgoingLinks = frontLinks(note_id);   // backend wikilink objects


  console.log('Backlink Links:', backlinkLinks);
  console.log('Outgoing Links:', outgoingLinks);

  const backlinks = backlinkLinks
    

  const outgoing = outgoingLinks
    

  // If nothing exists
  if (backlinks.length === 0 && outgoing.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <LinkIcon size={16} />
            Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8 text-sm">
            No linked notes yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <Card className="h-full w-full border-gray-200 shadow-lg bg-gradient-to-br from-white to-gray-50/50 flex flex-col">
        <CardHeader className="pb-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex-shrink-0">
          <CardTitle className="text-sm flex items-center gap-2 font-semibold text-gray-800">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <LinkIcon size={14} className="text-blue-600" />
            </div>
            Linked Notes
            <Badge variant="outline" className="ml-auto text-xs">
              {backlinks.length + outgoing.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0">
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-6 w-full min-w-0">

            {/* BACKLINKS */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                  <div className="p-1 bg-green-100 rounded">
                    <CornerUpLeft size={12} className="text-green-600" />
                  </div>
                  Backlinks
                </h3>
                <Badge variant="secondary" className="text-xs font-medium">
                  {backlinks.length}
                </Badge>
              </div>

              <div className="space-y-3 w-full min-w-0">
                {backlinks.map(note => (
                  <LinkCard
                    key={note.id}
                    note={note}
                    onClick={() => navigate(`/note/${note.note_uid}`)}
                    type="backlink"
                  />
                ))}

                {backlinks.length === 0 && (
                  <div className="text-center py-6">
                    <div className="p-3 bg-gray-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <CornerUpLeft size={16} className="text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">No backlinks found</p>
                  </div>
                )}
              </div>
            </section>

            {(backlinks.length > 0 && outgoing.length > 0) && (
              <div className="relative">
                <hr className="border-gray-200" />
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            )}

            {/* OUTGOING */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                  <div className="p-1 bg-purple-100 rounded">
                    <CornerUpRight size={12} className="text-purple-600" />
                  </div>
                  Outgoing Links
                </h3>
                <Badge variant="secondary" className="text-xs font-medium">
                  {outgoing.length}
                </Badge>
              </div>

              <div className="space-y-3 w-full min-w-0">
                {outgoing.map(note => (
                  <LinkCard
                    key={note.id}
                    note={note}
                    onClick={() => navigate(`/note/${note.note_uid}`)}
                    type="outgoing"
                  />
                ))}

                {outgoing.length === 0 && (
                  <div className="text-center py-6">
                    <div className="p-3 bg-gray-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <CornerUpRight size={16} className="text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">No outgoing links found</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
    </div>
  );
}

/* Card */
function LinkCard({ note, onClick, type }: { note: any; onClick: () => void; type?: string }) {
  const isBacklink = type === 'backlink';
  const isOutgoing = type === 'outgoing';
  
  const accentColor = isBacklink 
    ? 'green' 
    : isOutgoing 
    ? 'purple' 
    : 'blue';

  const borderColor = isBacklink
    ? 'hover:border-green-300 hover:shadow-green-100'
    : isOutgoing
    ? 'hover:border-purple-300 hover:shadow-purple-100'
    : 'hover:border-blue-300 hover:shadow-blue-100';

  const textColor = isBacklink
    ? 'group-hover:text-green-700'
    : isOutgoing
    ? 'group-hover:text-purple-700'
    : 'group-hover:text-blue-700';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer border border-gray-200 rounded-xl p-3 transition-all duration-200 
        ${borderColor} hover:shadow-lg hover:bg-white/80 hover:-translate-y-0.5 active:translate-y-0
        bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm w-full max-w-full overflow-hidden`}
    >
      <div className="flex items-start gap-3 w-full min-w-0">
        <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
          isBacklink ? 'bg-green-100' : isOutgoing ? 'bg-purple-100' : 'bg-blue-100'
        }`}>
          {isBacklink ? (
            <CornerUpLeft size={12} className="text-green-600" />
          ) : isOutgoing ? (
            <CornerUpRight size={12} className="text-purple-600" />
          ) : (
            <LinkIcon size={12} className="text-blue-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <h4 className={`text-sm font-semibold truncate transition-colors ${textColor} w-full`}>
            {note.title || 'Untitled Note'}
          </h4>

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={11} />
              <span>{new Date(note.updated_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: new Date(note.updated_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              })}</span>
              <span className="text-gray-400">at</span>
              <span>{new Date(note.updated_at).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true
              })}</span>
            </div>
            
            <span className="text-gray-300">•</span>
            
            {/* <span className="font-medium">{note.wordCount ?? 0} words</span> */}
          </div>

          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {note.tags.slice(0, 2).map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className={`text-[10px] px-2 py-0.5 font-medium ${
                    isBacklink ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                    isOutgoing ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
                    'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  #{tag}
                </Badge>
              ))}
              {note.tags.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-2 py-0.5 font-medium border-gray-300 text-gray-600"
                >
                  +{note.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
