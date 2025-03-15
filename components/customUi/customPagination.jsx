import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function CustomPagination({ currentPage, setCurrentPage, totalPages }) {
  console.log("currentPage", currentPage);
  console.log("totalPages", totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`${currentPage === 1 ? "opacity-50" : "cursor-pointer"}`}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => (
          <PaginationItem key={i + 1} className="cursor-pointer ">
            <PaginationLink
              onClick={() => setCurrentPage(i + 1)}
              isActive={currentPage === i + 1}
              className="!rounded-full"
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`${
              currentPage === totalPages ? "opacity-50" : "cursor-pointer"
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default CustomPagination;
