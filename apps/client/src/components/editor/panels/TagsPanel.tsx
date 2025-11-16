import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEnhancedNoteStore } from "@/stores/enhancedNoteStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, X, Search } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function TagsPanel() {
  const { setCurrentNote, getCurrentNoteId } = useEnhancedNoteStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 15;


console.log("TagsPanel rendered",);
  // ▶ Fetch tags using TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ["tags",  pageIndex, pageSize],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_BASE_URL;
      const token = localStorage.getItem("auth_token");
      const res = await axios.get(`${API_BASE_URL}/api/v1/note/tags`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        params: {
          page: pageIndex + 1,
          limit: pageSize
        }
      });
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  // ▶ Search + Pagination (server-side for pagination, client-side for search)
  const filteredTags = useMemo(() => {
    if (!data || !data.tags) return [];

    // Only apply search filter, pagination is handled by the server
    const tags = data.tags.filter((t: any) =>
      t.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return tags;
  }, [searchQuery, data]);

  const totalFiltered = filteredTags.length;
  console.log("totalFiltered ", totalFiltered);
  const totalTags = data?.total || 0;
  console.log("totalTags ", totalTags);
  const handleOpenNote = (uid: string) => {
    setCurrentNote(uid);
    navigate(`/note/${uid}`);   // 👈 update URL properly
  };
  console.log("current note ", getCurrentNoteId());
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Hash size={16} />
          Tags ({totalFiltered})
        </CardTitle>

        {/* Search bar */}
        {!selectedTag && (
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tags..."
              className="pl-8 text-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPageIndex(0); // Reset to first page when searching
              }}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[calc(100%-40px)] p-4">

          {/* ▶ FILTER: Notes under selected tag */}
          {selectedTag && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <Hash className="text-blue-600" size={14} />
                  <span className="font-medium text-sm text-blue-800">
                    Filtering by: #{selectedTag}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setSelectedTag(null)}
                >
                  <X size={12} />
                </Button>
              </div>

              <div className="text-xs text-blue-600 mt-1">
                {data.tags
                  ?.find((t: any) => t.tag === selectedTag)
                  ?.notes.length}{" "}
                notes
              </div>
            </div>
          )}

          {/* ▶ TAG LIST */}
          {!selectedTag && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">
                  Loading tags...
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No tags found.
                </div>
              ) : (
                filteredTags.map((t: any) => (
                  <div
                    key={t.tag}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                    onClick={() => setSelectedTag(t.tag)}
                  >
                    <div className="flex gap-2 items-center">
                      <Hash size={12} className="text-gray-400 group-hover:text-blue-500" />
                      <span className="text-sm font-medium group-hover:text-blue-600">
                        {t.tag}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {t.notes.length}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ▶ NOTES UNDER SELECTED TAG */}
        {selectedTag && (
  <div className="space-y-2">
    <h4 className="text-xs uppercase text-gray-500 tracking-wide">
      Notes with #{selectedTag}
    </h4>

    {data.tags
      ?.find((t: any) => t.tag === selectedTag)
      ?.notes.map((n: any) => {
        const isCurrent = getCurrentNoteId() === n.note_id.toString();

        console.log("Rendering note ", getCurrentNoteId(),n.note_id, " isCurrent: ", isCurrent);

        return (
          <div
            key={n.note_id}
            className={`p-3 border rounded-lg transition ${
              isCurrent
                ? "border-blue-500 bg-blue-50 cursor-default opacity-90"
                : "border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
            }`}
            onClick={() => {
              if (!isCurrent) {
                handleOpenNote(n.note_uid);
                setSelectedTag(null);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  isCurrent ? "text-blue-700" : "hover:text-blue-600"
                }`}
              >
                {n.note_name}
              </span>

              {isCurrent && (
                <span className="text-xs text-blue-700 border border-blue-200 rounded px-2 py-0.5">
                  OPEN
                </span>
              )}
            </div>
          </div>
        );
      })}
  </div>
)}


          {!selectedTag && !searchQuery && totalTags > pageSize && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => p - 1)}
              >
                Prev
              </Button>

              <span className="text-sm text-gray-500">
                Page {pageIndex + 1} / {Math.ceil(totalTags / pageSize)}
              </span>

              <Button
                size="sm"
                variant="outline"
                disabled={pageIndex + 1 >= Math.ceil(totalTags / pageSize)}
                onClick={() => setPageIndex((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
