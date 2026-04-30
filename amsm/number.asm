NODE_SIZE      EQU 32  
NUMBER_DATA_OFF EQU 0    
NODE_TYPE_OFF   EQU 16  
DIRTY_FLAG_OFF  EQU 17  
OUT_MAIN_PTR    EQU 18 
EDGES_LIST_PTR  EQU 26   

EDGE_SIZE       EQU 16
EDGE_TARGET_OFF EQU 0
EDGE_NEXT_OFF   EQU 8   

%macro TRIGGER_DEPENDENTS 1 
    push %1
    call notify_dependents
    add rsp, 8
%endmacro

number_node_set_value:
    push rbp
    mov rbp, rsp
    movsd qword [rdi + NUMBER_DATA_OFF], xmm0 
    mov byte [rdi + DIRTY_FLAG_OFF], 1      
    TRIGGER_DEPENDENTS rdi
    pop rbp
    ret

number_node_get_value:
    lea rax, [rdi + NUMBER_DATA_OFF]  
    ret

number_node_read_output:
    lea rax, [rdi + NUMBER_DATA_OFF]
    mov rcx, 1        
    ret

number_node_recompute:
    mov byte [rdi + DIRTY_FLAG_OFF], 0
    ret

notify_dependents:
    push rbp
    mov rbp, rsp
    push rbx             
    mov rbx, [rdi + EDGES_LIST_PTR]   
.next_edge:
    test rbx, rbx
    jz .done
    mov rsi, [rbx + EDGE_TARGET_OFF]   ; RSI = Node* target
    mov byte [rsi + DIRTY_FLAG_OFF], 1
    mov rbx, [rbx + EDGE_NEXT_OFF]
    jmp .next_edge
.done:
    pop rbx
    pop rbp
    ret

    
